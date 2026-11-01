import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { catchError, firstValueFrom, from, map, throwError, type Observable } from 'rxjs';
import { canonicalRequestHash } from './canonical-request.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../../../../packages/contracts/openapi/contract-manifest.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import { CommandFailureError, IdempotencyConflictError, isResourceReference, type CommandResult, type CommandStatus, type ResourceReference } from '../../modules/integration/idempotency/in-memory-idempotency-store.js';
import { IdempotencyOwnershipLostError, type PostgresIdempotencyInput, type PostgresIdempotencyRepository } from '../../modules/integration/idempotency/postgres-idempotency-repository.js';
import type { GeneratedOperation } from '../../../../../packages/contracts/openapi/client.js';
import type { ContractValidator } from '../../../../../packages/contracts/openapi/runtime-validator.js';
import { buildProblem, normalizeRequestId, ProblemError, RecoverableProblemError } from '../http/problem.js';
import { ensureContractResponseContentType, validateContractResponse } from '../http/contract-response.interceptor.js';
import { restoreIdempotencyTransaction, setIdempotencyTransaction } from './idempotency-transaction-context.js';
import type { AuthorizationPrincipal } from '../../modules/identity/domain/authz.js';

interface PrincipalRequest extends FastifyRequest {
  user?: AuthorizationPrincipal;
}

export type IdempotencyReplayAdapter = (operationId: string, principal: AuthorizationPrincipal, request: PrincipalRequest, stored: CommandResult<unknown>) => Promise<CommandResult<unknown> | undefined>;

@Injectable()
export class IdempotencyExecutionInterceptor implements NestInterceptor {
  constructor(private readonly repository: PostgresIdempotencyRepository, private readonly validator?: ContractValidator, private readonly replayAdapter?: IdempotencyReplayAdapter) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const match = operationForRequest(request);
    const principal = request.user;
    const idempotencyKey = headerString(request.headers['idempotency-key']);
    if (match === undefined || !match.definition.idempotency || principal === undefined || idempotencyKey === undefined) return next.handle();

    const input: PostgresIdempotencyInput = {
      actorId: principal.userId,
      organizationId: principal.organizationId,
      operationId: match.definition.operationId,
      idempotencyKey,
      requestHash: canonicalRequestHash({
        method: request.method,
        path: request.url.split('?')[0] ?? request.url,
        query: asCanonicalQuery(request.query),
        body: request.body,
        ...(headerString(request.headers['if-match']) === undefined ? {} : { ifMatch: headerString(request.headers['if-match']) as string }),
      }),
    };
    const replayAdapter = this.replayAdapter;

    return from(this.repository.execute(input, async (client, claim) => {
      const previous = setIdempotencyTransaction(request, { client, claim });
      try {
        const body = await firstValueFrom(next.handle());
        const status = response.statusCode ?? 200;
        if (this.validator !== undefined) {
          ensureContractResponseContentType(match.operation, status, response);
          validateContractResponse(match.operation, status, body, response, this.validator, normalizeRequestId(request.headers['x-request-id']));
        }
        const contentLocation = headerString(response.getHeader('content-location'));
        const resource = resourceReferenceForResponse(match.definition.operationId, match.operation, request, response, body, status);
        const responseContract = (match.operation as GeneratedOperation).responses[String(status)];
        if (status >= 200 && status < 300 && status !== 202 && responseContract?.schema !== undefined && resource === undefined) {
          throw new ProblemError(buildProblem({
            status: 500,
            code: 'INTERNAL_ERROR',
            title: 'Operation resource reference projection failed',
            requestId: normalizeRequestId(request.headers['x-request-id']),
            retryable: false,
          }));
        }
        const result: CommandResult<unknown> = {
          status,
          body,
          ...(match.definition.operationId === 'createUploadIntent' ? { persistedBody: {} } : {}),
          ...(resource === undefined ? {} : { resource }),
          ...(contentLocation === undefined ? {} : { resultHref: contentLocation }),
          responseHeaders: replayableResponseHeaders(response),
        };
        return result;
      } finally {
        restoreIdempotencyTransaction(request, previous);
      }
    }, replayAdapter === undefined ? undefined : (stored) => replayAdapter(match.definition.operationId, principal, request, stored))).pipe(map((outcome) => {
      const commandStatus = isCommandStatus(outcome)
        ? publicCommandStatus(outcome, match.operation)
        : isCommandResult(outcome) && outcome.status === 202 && isCommandStatus(outcome.body)
          ? publicCommandStatus(outcome.body, match.operation)
          : undefined;
      if (commandStatus !== undefined) {
        response.statusCode = 202;
        response.header('cache-control', 'no-store');
        response.header('content-location', '/api/v1/commands/status');
        response.header('retry-after', String(Math.max(1, Math.ceil(commandStatus.retryAfterMs / 1000))));
        if (this.validator !== undefined) {
          ensureContractResponseContentType(match.operation, 202, response);
          validateContractResponse(match.operation, 202, commandStatus, response, this.validator, normalizeRequestId(request.headers['x-request-id']));
        }
        return commandStatus;
      }
      if (!isCommandResult(outcome)) throw new Error('Invalid idempotency execution outcome.');
      if (outcome.replayed === true) {
        for (const [name, value] of Object.entries(outcome.responseHeaders ?? {})) response.header(name, value);
        response.header('idempotent-replay', 'true');
      }
      response.statusCode = outcome.status;
      if (this.validator !== undefined) {
        ensureContractResponseContentType(match.operation, outcome.status, response);
        validateContractResponse(match.operation, outcome.status, outcome.body, response, this.validator, normalizeRequestId(request.headers['x-request-id']));
      }
      return outcome.body;
    }), catchError((error: unknown) => {
      if (error instanceof IdempotencyConflictError) {
        return throwError(() => new ProblemError(buildProblem({
          status: 409,
          code: 'IDEMPOTENCY_KEY_REUSED',
          title: 'Idempotency key was reused with a different request.',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: false,
          meta: { operationId: match.definition.operationId, commandStatusHref: '/api/v1/commands/status' },
        })));
      }
      if (error instanceof CommandFailureError) return throwError(() => new ProblemError(error.problem));
      if (error instanceof IdempotencyOwnershipLostError) {
        return throwError(() => new RecoverableProblemError(buildProblem({
          status: 500,
          code: 'INTERNAL_ERROR',
          title: 'Internal server error',
          requestId: normalizeRequestId(request.headers['x-request-id']),
          retryable: true,
        })));
      }
      return throwError(() => error);
    }));
  }
}

function operationForRequest(request: FastifyRequest): { definition: (typeof EXPECTED_OPERATION_MANIFEST)[number]; operation: (typeof operations)[OperationId] } | undefined {
  const path = (request.routeOptions.url ?? request.url.split('?')[0] ?? '').replace(/^\/api\/v1/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  const method = request.method.toUpperCase();
  const definition = EXPECTED_OPERATION_MANIFEST.find((candidate) => candidate.method === method.toLowerCase() && candidate.path === path);
  if (definition === undefined) return undefined;
  const operation = operations[definition.operationId as OperationId];
  return operation === undefined ? undefined : { definition, operation };
}

function isCommandStatus(value: unknown): value is CommandStatus {
  return typeof value === 'object' && value !== null && 'state' in value && 'commandId' in value;
}

function isCommandResult(value: CommandResult<unknown> | CommandStatus): value is CommandResult<unknown> {
  return typeof value === 'object' && value !== null && 'status' in value && 'body' in value;
}

function publicCommandStatus(value: CommandStatus, operation: GeneratedOperation): CommandStatus {
  const publicValue = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'claimRole' && key !== 'ownerToken' && key !== 'attemptCount')) as CommandStatus;
  if (publicValue.state === 'IN_PROGRESS' || operation.responses['202']?.schema !== 'CommandStatusInProgress') return publicValue;
  return {
    ...publicValue,
    state: 'IN_PROGRESS',
    completedAt: null,
    retryAfterMs: Math.max(1, publicValue.retryAfterMs),
    httpStatus: null,
    resource: null,
    resultHref: null,
    problem: null,
  };
}

export function resourceReferenceForResponse(operationId: string, operation: GeneratedOperation, request: PrincipalRequest, response: FastifyReply, body: unknown, status: number): ResourceReference | undefined {
  const projector = IDEMPOTENT_RESOURCE_PROJECTORS[operationId];
  const responseContract = operation.responses[String(status)];
  if (projector === undefined || responseContract?.schema !== projector.schema || status !== projector.status) return undefined;
  const nestedResource = projector.resourceFromBody?.(body);
  const id = projector.resourceFromBody === undefined
    ? isRecord(body) && typeof body.id === 'string' ? body.id : undefined
    : nestedResource?.id;
  if (id === undefined) return undefined;
  const href = projector.href(request, id);
  if (href === undefined) return undefined;
  const location = headerString(response.getHeader('location'));
  const contentLocation = headerString(response.getHeader('content-location'));
  if (projector.requireLocation === true && location === undefined) return undefined;
  const bodyHref = projector.resourceFromBody === undefined
    ? isRecord(body) && typeof body.href === 'string' ? body.href : undefined
    : nestedResource?.href;
  if ((location !== undefined && location !== href) || (contentLocation !== undefined && contentLocation !== href) || (bodyHref !== undefined && bodyHref !== href)) return undefined;
  const version = projector.resourceFromBody === undefined
    ? isRecord(body) && typeof body.version === 'number' ? body.version : undefined
    : nestedResource?.version;
  const resource = { type: projector.type, id, href, ...(version === undefined ? {} : { version }) };
  return isResourceReference(resource) ? resource : undefined;
}

interface ResourceProjector {
  readonly status: number;
  readonly schema: string;
  readonly type: string;
  readonly hrefPolicy: 'collection' | 'organization-user' | string;
  readonly pathParameter: string | null;
  readonly href: (request: PrincipalRequest, resourceId: string) => string | undefined;
  readonly resourceFromBody?: (body: unknown) => { id: string; href: string; version?: number } | undefined;
  readonly requireLocation?: boolean;
}

const collectionProjector = (status: number, schema: string, type: string, collection: string): ResourceProjector => ({ status, schema, type, hrefPolicy: 'collection', pathParameter: null, href: (_request, id) => `${collection}/${id}` });
const organizationUserProjector = (): ResourceProjector => ({
  status: 201,
  schema: 'User',
  type: 'USER',
  hrefPolicy: 'organization-user',
  pathParameter: 'id',
  href: (request, id) => {
    const params = isRecord(request.params) ? request.params : {};
    const organizationId = typeof params.id === 'string' ? params.id : undefined;
    return organizationId === undefined ? undefined : `/api/v1/organizations/${organizationId}/users/${id}`;
  },
});
const existingProjector = (status: number, schema: string, type: string, collection: string, parameter = 'id'): ResourceProjector => ({
  status,
  schema,
  type,
  hrefPolicy: 'existing:' + parameter,
  pathParameter: parameter,
  href: (request, id) => {
    const params = isRecord(request.params) ? request.params : {};
    const pathId = typeof params[parameter] === 'string' ? params[parameter] : undefined;
    return pathId === id ? `${collection}/${id}` : undefined;
  },
});
const uploadIntentProjector = (): ResourceProjector => ({
  status: 201,
  schema: 'UploadIntent',
  type: 'FILE',
  hrefPolicy: 'nested:file',
  pathParameter: null,
  requireLocation: true,
  href: (_request, id) => `/api/v1/files/${id}`,
  resourceFromBody: (body) => {
    if (!isRecord(body) || !isRecord(body.file)) return undefined;
    const id = typeof body.file.id === 'string' ? body.file.id : undefined;
    const fileHref = typeof body.file.href === 'string' ? body.file.href : undefined;
    const intentHref = typeof body.href === 'string' ? body.href : undefined;
    if (id === undefined || fileHref === undefined || intentHref === undefined) return undefined;
    const canonicalHref = `/api/v1/files/${id}`;
    if (fileHref !== canonicalHref || intentHref !== canonicalHref) return undefined;
    const version = typeof body.file.version === 'number' ? body.file.version : undefined;
    return { id, href: fileHref, ...(version === undefined ? {} : { version }) };
  },
});

/**
 * Every synchronous idempotent success is listed here deliberately.  A
 * response schema alone cannot identify a canonical resource: action URLs
 * (for example reservation release) can return a newly-created operation.
 */
export const IDEMPOTENT_RESOURCE_PROJECTORS: Readonly<Record<string, ResourceProjector>> = {
  createUser: organizationUserProjector(),
  updateUserRoleBindings: existingProjector(200, 'User', 'USER', '/api/v1/users'),
  updateUserDataScopeGrants: existingProjector(200, 'User', 'USER', '/api/v1/users'),
  createCustomer: collectionProjector(201, 'Customer', 'CUSTOMER', '/api/v1/customers'),
  updateCustomer: existingProjector(200, 'Customer', 'CUSTOMER', '/api/v1/customers'),
  submitCustomerApproval: existingProjector(200, 'Customer', 'CUSTOMER', '/api/v1/customers'),
  approveCustomer: existingProjector(200, 'Customer', 'CUSTOMER', '/api/v1/customers'),
  rejectCustomer: existingProjector(200, 'Customer', 'CUSTOMER', '/api/v1/customers'),
  reassignCustomer: existingProjector(200, 'Customer', 'CUSTOMER', '/api/v1/customers'),
  createProduct: collectionProjector(201, 'Product', 'PRODUCT', '/api/v1/products'),
  updateProduct: existingProjector(200, 'Product', 'PRODUCT', '/api/v1/products'),
  createSku: collectionProjector(201, 'Sku', 'SKU', '/api/v1/skus'),
  updateSku: existingProjector(200, 'Sku', 'SKU', '/api/v1/skus'),
  createOrder: collectionProjector(201, 'Order', 'ORDER', '/api/v1/orders'),
  updateOrder: existingProjector(200, 'Order', 'ORDER', '/api/v1/orders'),
  transitionOrder: existingProjector(200, 'Order', 'ORDER', '/api/v1/orders'),
  createInventoryReservation: collectionProjector(201, 'InventoryReservation', 'INVENTORY_RESERVATION', '/api/v1/inventory/reservations'),
  releaseInventoryReservation: collectionProjector(200, 'InventoryOperation', 'INVENTORY_OPERATION', '/api/v1/inventory/operations'),
  createInventoryObservation: collectionProjector(201, 'InventoryObservation', 'INVENTORY_OBSERVATION', '/api/v1/inventory/observations'),
  createInitialReceipt: collectionProjector(201, 'InventoryOperation', 'INVENTORY_OPERATION', '/api/v1/inventory/operations'),
  createInventoryReceipt: collectionProjector(201, 'InventoryOperation', 'INVENTORY_OPERATION', '/api/v1/inventory/operations'),
  createInventoryAdjustment: collectionProjector(201, 'InventoryOperation', 'INVENTORY_OPERATION', '/api/v1/inventory/operations'),
  issueInventory: collectionProjector(201, 'InventoryOperation', 'INVENTORY_OPERATION', '/api/v1/inventory/operations'),
  reverseInventoryOperation: collectionProjector(201, 'InventoryOperation', 'INVENTORY_OPERATION', '/api/v1/inventory/operations'),
  createPayment: collectionProjector(201, 'Payment', 'PAYMENT', '/api/v1/payments'),
  attachPaymentProof: existingProjector(200, 'Payment', 'PAYMENT', '/api/v1/payments'),
  submitPaymentReview: existingProjector(200, 'Payment', 'PAYMENT', '/api/v1/payments'),
  reviewPayment: existingProjector(200, 'Payment', 'PAYMENT', '/api/v1/payments'),
  reversePayment: existingProjector(200, 'Payment', 'PAYMENT', '/api/v1/payments'),
  createUploadIntent: uploadIntentProjector(),
  completeUpload: existingProjector(200, 'File', 'FILE', '/api/v1/files'),
  createDocument: collectionProjector(201, 'Document', 'DOCUMENT', '/api/v1/documents'),
  updateDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  createDocumentVersion: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  submitDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  approveDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  rejectDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  finalizeDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  issueDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  voidDocument: existingProjector(200, 'Document', 'DOCUMENT', '/api/v1/documents'),
  createTask: collectionProjector(201, 'Task', 'TASK', '/api/v1/tasks'),
  completeTask: existingProjector(200, 'Task', 'TASK', '/api/v1/tasks'),
};

function headerString(value: string | string[] | number | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : typeof value === 'number' ? String(value) : value;
}

function replayableResponseHeaders(response: FastifyReply): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of ['location', 'content-location', 'etag', 'retry-after', 'cache-control']) {
    const value = headerString(response.getHeader(name));
    if (value !== undefined) headers[name] = value;
  }
  return headers;
}

function asCanonicalQuery(value: unknown): Record<string, string | string[] | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item.map(String) : typeof item === 'string' ? item : item === undefined ? undefined : String(item)]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
