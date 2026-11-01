import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, Headers, Param, Post, Put, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PoolClient } from 'pg';
import type { components } from '../../../../../../packages/contracts/openapi/generated.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../../../common/http/problem.js';
import { problemForBackend } from '../../../common/http/backend-controller.js';
import {
  IdentityCommandService,
  IdentityCursorError,
  IdentityUserNotFoundError,
  IdentityVersionConflictError,
  type AuditQueryFilters,
} from '../application/identity-command.service.js';
import type { PostgresClaim } from '../../integration/idempotency/postgres-idempotency-repository.js';
import type { AuthorizationPrincipal } from '../domain/authz.js';
import { AuthorizationDeniedError } from '../domain/authz.js';
import { requireIdempotencyTransaction } from '../../../common/security/idempotency-transaction-context.js';

type UserCreateRequest = components['schemas']['UserCreateRequest'];
type RoleBindingsUpdateRequest = components['schemas']['RoleBindingsUpdateRequest'];
type DataScopeUpdateRequest = components['schemas']['DataScopeUpdateRequest'];
type UserResponse = components['schemas']['User'];
type CommandStatusInProgress = components['schemas']['CommandStatusInProgress'];
type AuditEventPageResponse = components['schemas']['AuditEventPage'];

interface IdentityRequest extends FastifyRequest {
  user?: AuthorizationPrincipal;
}

@Controller()
export class IdentityController {
  constructor(private readonly service: IdentityCommandService) {}

  @Get('users/:id')
  async getUser(@Req() request: IdentityRequest, @Param('id') id: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<UserResponse> {
    try {
      const user = await this.service.getUser(this.principal(request), id, this.requestId(request));
      reply.header('etag', etag(user.version));
      return toUserResponse(user);
    } catch (error) {
      throw this.toProblem(error, request, id);
    }
  }

  @Post('organizations/:id/users')
  async createUser(@Req() request: IdentityRequest, @Param('id') organizationId: string, @Body() body: UserCreateRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<UserResponse> {
    try {
      const user = await this.service.createUser(this.principal(request), organizationId, body, this.requestId(request), this.transactionClient(request));
      reply.header('etag', etag(user.version)).header('location', `/api/v1/organizations/${organizationId}/users/${user.id}`).code(201);
      return toUserResponse(user);
    } catch (error) {
      throw this.toProblem(error, request);
    }
  }

  @Put('users/:id/role-bindings')
  async updateRoleBindings(@Req() request: IdentityRequest, @Param('id') id: string, @Body() body: RoleBindingsUpdateRequest, @Headers('if-match') ifMatch: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<UserResponse> {
    try {
      const user = await this.service.updateRoleBindings(this.principal(request), id, parseEtag(ifMatch), body.bindings, this.requestId(request), this.transactionClient(request));
      reply.header('etag', etag(user.version));
      return toUserResponse(user);
    } catch (error) {
      throw this.toProblem(error, request, id);
    }
  }

  @Put('users/:id/data-scope-grants')
  async updateDataScopeGrants(@Req() request: IdentityRequest, @Param('id') id: string, @Body() body: DataScopeUpdateRequest, @Headers('if-match') ifMatch: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<UserResponse> {
    try {
      const user = await this.service.updateDataScopeGrants(this.principal(request), id, parseEtag(ifMatch), body.grants, this.requestId(request), this.transactionClient(request));
      reply.header('etag', etag(user.version));
      return toUserResponse(user);
    } catch (error) {
      throw this.toProblem(error, request, id);
    }
  }

  @Post('users/:id/disable')
  async disableUser(@Req() request: IdentityRequest, @Param('id') id: string, @Headers('if-match') ifMatch: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<CommandStatusInProgress> {
    try {
      const claim = this.transactionClaim(request);
      if (claim === undefined || claim.ownerToken === undefined) throw new Error('Disable command requires an idempotency owner claim.');
      await this.service.queueDisableUser(this.principal(request), id, parseEtag(ifMatch), this.requestId(request), {
        commandId: claim.commandId,
        operationId: claim.operationId,
        ownerToken: claim.ownerToken,
        startedAt: claim.startedAt,
        expiresAt: claim.expiresAt,
        retryAfterMs: claim.retryAfterMs,
      }, this.transactionClient(request));
      const now = new Date();
      const command: CommandStatusInProgress = {
        commandId: claim?.commandId ?? randomUUID(),
        operationId: claim?.operationId ?? 'disableUser',
        state: 'IN_PROGRESS',
        startedAt: claim?.startedAt ?? now.toISOString(),
        completedAt: null,
        expiresAt: claim?.expiresAt ?? new Date(now.getTime() + 60_000).toISOString(),
        retryAfterMs: Math.max(1, claim?.retryAfterMs ?? 1000),
        httpStatus: null,
        resource: null,
        resultHref: null,
        problem: null,
      };
      reply.code(202).header('cache-control', 'no-store').header('content-location', '/api/v1/commands/status').header('retry-after', '1');
      return command;
    } catch (error) {
      throw this.toProblem(error, request, id);
    }
  }

  @Get('audit-events')
  async listAuditEvents(@Req() request: IdentityRequest): Promise<AuditEventPageResponse> {
    try {
      const query = isRecord(request.query) ? request.query : {};
      const pageSize = query['page[size]'] === undefined ? undefined : Number(query['page[size]']);
      const filters: AuditQueryFilters = {};
      if (typeof query['page[after]'] === 'string') filters.after = query['page[after]'];
      if (pageSize !== undefined && !Number.isNaN(pageSize)) filters.size = pageSize;
      const actorUserId = stringArray(query['filter[actorUserId]']);
      const action = stringArray(query['filter[action]']);
      const resourceType = stringArray(query['filter[resourceType]']);
      if (actorUserId !== undefined) filters.actorUserId = actorUserId;
      if (action !== undefined) filters.action = action;
      if (resourceType !== undefined) filters.resourceType = resourceType;
      const page = await this.service.listAuditEvents(this.principal(request), filters, this.requestId(request));
      return page as AuditEventPageResponse;
    } catch (error) {
      throw this.toProblem(error, request);
    }
  }

  private principal(request: IdentityRequest): AuthorizationPrincipal {
    if (request.user === undefined) throw new ProblemError(buildProblem({ status: 401, code: 'AUTHENTICATION_REQUIRED', title: 'Authentication required', requestId: this.requestId(request), retryable: false }));
    return request.user;
  }

  private requestId(request: FastifyRequest): string {
    return normalizeRequestId(request.headers['x-request-id']);
  }

  private transactionClient(request: FastifyRequest): PoolClient | undefined {
    try {
      return requireIdempotencyTransaction(request).client;
    } catch {
      return undefined;
    }
  }

  private transactionClaim(request: FastifyRequest): PostgresClaim | undefined {
    try {
      const claim = requireIdempotencyTransaction(request).claim;
      return claim;
    } catch {
      return undefined;
    }
  }

  private toProblem(error: unknown, request: FastifyRequest, resourceId?: string): ProblemError {
    const requestId = this.requestId(request);
    if (error instanceof ProblemError) return error;
    if (error instanceof IdentityUserNotFoundError) return new ProblemError(buildProblem({ status: 404, code: 'RESOURCE_NOT_FOUND', title: 'Resource not found', requestId, retryable: false }));
    if (error instanceof IdentityCursorError) return new ProblemError(buildProblem({ status: 400, code: 'VALIDATION_FAILED', title: 'Validation failed', requestId, retryable: false, meta: { violations: [{ field: 'page[after]', code: 'INVALID', message: 'The audit cursor is invalid.' }] } }));
    if (error instanceof IdentityVersionConflictError) {
      return new ProblemError(buildProblem({
        status: 409,
        code: 'VERSION_CONFLICT',
        title: 'Resource version conflict',
        requestId,
        retryable: false,
        meta: { currentVersion: error.currentVersion, currentEtag: etag(error.currentVersion), resourceHref: `/api/v1/users/${resourceId ?? 'unknown'}` },
      }));
    }
    if (error instanceof AuthorizationDeniedError) {
      const validation = error.reason.startsWith('scope-') || error.reason.includes('GROUP_SET') || error.reason === 'duplicate-resource-scope' || error.reason === 'role-bindings-invalid';
      return new ProblemError(buildProblem({
        status: validation ? 400 : 403,
        code: validation ? 'VALIDATION_FAILED' : 'PERMISSION_DENIED',
        title: validation ? 'Validation failed' : 'Permission denied',
        requestId,
        retryable: false,
        ...(validation ? { meta: { violations: [{ field: 'body', code: 'INVALID', message: 'The identity authorization request is invalid.' }] } } : {}),
      }));
    }
    if (isUniqueViolation(error)) return new ProblemError(buildProblem({ status: 409, code: 'DUPLICATE_BUSINESS_KEY', title: 'Identity already exists', requestId, retryable: false }));
    return problemForBackend(error, request);
  }
}

function toUserResponse(user: { id: string; organizationId: string; version: number; createdAt: string; updatedAt: string; username: string; roles: readonly string[]; status: 'ACTIVE' | 'DISABLED' }): UserResponse {
  return {
    id: user.id,
    organizationId: user.organizationId,
    version: user.version,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    username: user.username,
    role: user.roles[0] ?? 'UNKNOWN',
    status: user.status,
  };
}

function parseEtag(value: string | undefined): number {
  const match = typeof value === 'string' ? /^"v([1-9][0-9]*)"$/.exec(value) : undefined;
  if (match === null || match === undefined) throw new AuthorizationDeniedError('invalid-version');
  return Number(match[1]);
}

function etag(version: number): string {
  return `"v${version}"`;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] | undefined {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value;
  return undefined;
}
