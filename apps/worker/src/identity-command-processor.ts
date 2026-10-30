import { buildProblem, type ProblemDocument } from '../../api/src/common/http/problem.js';
import {
  IdentityUserNotFoundError,
  IdentityVersionConflictError,
  type AuditEventInput,
  type DisableUserMutation,
  type DisableCommandClaim,
} from '../../api/src/modules/identity/application/identity-command.service.js';
import { AuthorizationDeniedError } from '../../api/src/modules/identity/domain/authz.js';
import type { PostgresIdempotencyRepository } from '../../api/src/modules/integration/idempotency/postgres-idempotency-repository.js';
import type { CommandResult } from '../../api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import type { PostgresIdentityStore } from '../../api/src/modules/identity/infrastructure/postgres-identity.store.js';
import type { OutboxEvent } from './worker.js';

type DisableCommandStore = Pick<PostgresIdentityStore, 'disableUser'>;
type DisableCommandRepository = Pick<PostgresIdempotencyRepository, 'withTransaction' | 'complete' | 'fail'>;

export class IdentityCommandProcessor {
  constructor(private readonly store: DisableCommandStore, private readonly repository: DisableCommandRepository) {}

  async process(event: OutboxEvent): Promise<void> {
    if (event.topic !== 'identity.command.disable_user') return;
    const command = parseDisableCommand(event.payload);
    await this.repository.withTransaction(async (client) => {
      await client.query('SAVEPOINT identity_command');
      try {
        const disabled = await this.store.disableUser({ ...command.mutation, client });
        const resource = { type: 'USER', id: disabled.id, version: disabled.version, href: `/api/v1/users/${disabled.id}` };
        const result: CommandResult<Record<string, unknown>> = {
          status: 202,
          body: {
            commandId: command.commandId,
            operationId: command.operationId,
            state: 'SUCCEEDED',
            startedAt: command.startedAt,
            completedAt: new Date().toISOString(),
            expiresAt: command.expiresAt,
            retryAfterMs: 0,
            httpStatus: 202,
            resource,
            resultHref: null,
            problem: null,
          },
          resource,
        };
        await this.repository.complete(client, command.commandId, command.ownerToken, result);
        await client.query('RELEASE SAVEPOINT identity_command');
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT identity_command');
        const problem = commandProblem(error, command.mutation.audit.requestId, command.mutation.targetUserId);
        if (problem === undefined) throw error;
        await this.repository.fail(client, command.commandId, command.ownerToken, problem);
        await client.query('RELEASE SAVEPOINT identity_command');
      }
    });
  }
}

interface ParsedDisableCommand extends DisableCommandClaim {
  mutation: DisableUserMutation;
}

function parseDisableCommand(payload: Record<string, unknown>): ParsedDisableCommand {
  if (!isRecord(payload) || typeof payload.commandId !== 'string' || typeof payload.operationId !== 'string' || typeof payload.ownerToken !== 'string' || typeof payload.startedAt !== 'string' || typeof payload.expiresAt !== 'string' || typeof payload.retryAfterMs !== 'number' || !isRecord(payload.mutation)) {
    throw new Error('Invalid identity disable command payload.');
  }
  const mutation = payload.mutation;
  if (typeof mutation.organizationId !== 'string' || typeof mutation.targetUserId !== 'string' || typeof mutation.actorUserId !== 'string' || typeof mutation.expectedVersion !== 'number' || !isRecord(mutation.audit)) throw new Error('Invalid identity disable mutation payload.');
  const audit = mutation.audit;
  if (typeof audit.organizationId !== 'string' || typeof audit.actorUserId !== 'string' || typeof audit.action !== 'string' || typeof audit.resourceType !== 'string' || typeof audit.resourceId !== 'string' || (audit.outcome !== 'SUCCEEDED' && audit.outcome !== 'DENIED' && audit.outcome !== 'FAILED') || typeof audit.requestId !== 'string') throw new Error('Invalid identity disable audit payload.');
  const ownerToken = Buffer.from(payload.ownerToken, 'base64');
  if (ownerToken.length < 16) throw new Error('Identity disable command owner token is invalid.');
  return {
    commandId: payload.commandId,
    operationId: payload.operationId,
    ownerToken,
    startedAt: payload.startedAt,
    expiresAt: payload.expiresAt,
    retryAfterMs: payload.retryAfterMs,
    mutation: {
      organizationId: mutation.organizationId,
      targetUserId: mutation.targetUserId,
      actorUserId: mutation.actorUserId,
      expectedVersion: mutation.expectedVersion,
      audit: {
        organizationId: audit.organizationId,
        actorUserId: audit.actorUserId,
        action: audit.action,
        resourceType: audit.resourceType,
        resourceId: audit.resourceId,
        outcome: audit.outcome,
        requestId: audit.requestId,
        ...(typeof audit.reason === 'string' ? { reason: audit.reason } : {}),
        ...(isRecord(audit.beforeSummary) ? { beforeSummary: audit.beforeSummary } : {}),
        ...(isRecord(audit.afterSummary) ? { afterSummary: audit.afterSummary } : {}),
        ...(typeof audit.traceId === 'string' ? { traceId: audit.traceId } : {}),
      } satisfies AuditEventInput,
    },
  };
}

function commandProblem(error: unknown, requestId: string, resourceId: string): ProblemDocument | undefined {
  if (error instanceof IdentityUserNotFoundError) return buildProblem({ status: 404, code: 'RESOURCE_NOT_FOUND', title: 'Resource not found', requestId, retryable: false });
  if (error instanceof IdentityVersionConflictError) return buildProblem({ status: 409, code: 'VERSION_CONFLICT', title: 'Resource version conflict', requestId, retryable: false, meta: { currentVersion: error.currentVersion, currentEtag: `"v${error.currentVersion}"`, resourceHref: `/api/v1/users/${resourceId}` } });
  if (error instanceof AuthorizationDeniedError) return buildProblem({ status: 403, code: 'PERMISSION_DENIED', title: 'Permission denied', requestId, retryable: false });
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
