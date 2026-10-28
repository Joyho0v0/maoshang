import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { catchError, firstValueFrom, from, map, throwError, type Observable } from 'rxjs';
import { canonicalRequestHash } from './canonical-request.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../../../../packages/contracts/openapi/contract-manifest.js';
import { operations, type OperationId } from '../../../../../packages/contracts/openapi/generated-client.js';
import { CommandFailureError, IdempotencyConflictError, type CommandResult, type CommandStatus, type ResourceReference } from '../../modules/integration/idempotency/in-memory-idempotency-store.js';
import type { PostgresIdempotencyInput, PostgresIdempotencyRepository } from '../../modules/integration/idempotency/postgres-idempotency-repository.js';
import type { GeneratedOperation } from '../../../../../packages/contracts/openapi/client.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../http/problem.js';
import { restoreIdempotencyTransaction, setIdempotencyTransaction } from './idempotency-transaction-context.js';

interface PrincipalRequest extends FastifyRequest {
  user?: { id: string; organizationId: string };
}

@Injectable()
export class IdempotencyExecutionInterceptor implements NestInterceptor {
  constructor(private readonly repository: PostgresIdempotencyRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<PrincipalRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const match = operationForRequest(request);
    const principal = request.user;
    const idempotencyKey = headerString(request.headers['idempotency-key']);
    if (match === undefined || !match.definition.idempotency || principal === undefined || idempotencyKey === undefined) return next.handle();

    const input: PostgresIdempotencyInput = {
      actorId: principal.id,
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

    return from(this.repository.execute(input, async (client, claim) => {
      const previous = setIdempotencyTransaction(request, { client, claim });
      try {
        const body = await firstValueFrom(next.handle());
        const contentLocation = headerString(response.getHeader('content-location'));
        const resource = resourceReferenceForResponse(match.definition.operationId, match.operation, request, response, body, response.statusCode ?? 200);
        const result: CommandResult<unknown> = {
          status: response.statusCode ?? 200,
          body,
          ...(resource === undefined ? {} : { resource }),
          ...(contentLocation === undefined ? {} : { resultHref: contentLocation }),
          responseHeaders: replayableResponseHeaders(response),
        };
        return result;
      } finally {
        restoreIdempotencyTransaction(request, previous);
      }
    })).pipe(map((outcome) => {
      if (isCommandStatus(outcome)) {
        response.statusCode = 202;
        response.header('cache-control', 'no-store');
        response.header('content-location', '/api/v1/commands/status');
        response.header('retry-after', String(Math.max(1, Math.ceil(outcome.retryAfterMs / 1000))));
        return outcome;
      }
      if (outcome.replayed === true) {
        for (const [name, value] of Object.entries(outcome.responseHeaders ?? {})) response.header(name, value);
        response.header('idempotent-replay', 'true');
      }
      response.statusCode = outcome.status;
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

function isCommandStatus(value: CommandResult<unknown> | CommandStatus): value is CommandStatus {
  return typeof value === 'object' && value !== null && 'state' in value && 'commandId' in value;
}

export function resourceReferenceForResponse(operationId: string, operation: GeneratedOperation, request: PrincipalRequest, response: FastifyReply, body: unknown, status: number): ResourceReference | undefined {
  const schema = operation.responses[String(status)]?.schema;
  const type = resourceTypeForSchema(schema);
  const id = isRecord(body) && typeof body.id === 'string' ? body.id : undefined;
  const href = headerString(response.getHeader('location'))
    ?? headerString(response.getHeader('content-location'))
    ?? (isRecord(body) && typeof body.href === 'string' ? body.href : undefined)
    ?? resourceHrefFromRequest(operationId, request, id);
  if (type === undefined || id === undefined || href === undefined || !href.startsWith('/api/v1/')) return undefined;
  const version = isRecord(body) && typeof body.version === 'number' ? body.version : undefined;
  return { type, id, href, ...(version === undefined ? {} : { version }) };
}

function resourceTypeForSchema(schema: string | undefined): string | undefined {
  const types: Readonly<Record<string, string>> = {
    User: 'USER',
    Customer: 'CUSTOMER',
    Product: 'PRODUCT',
    Sku: 'SKU',
    Order: 'ORDER',
    Payment: 'PAYMENT',
    File: 'FILE',
    Document: 'DOCUMENT',
    Task: 'TASK',
    InventoryOperation: 'INVENTORY_OPERATION',
    InventoryReservation: 'INVENTORY_RESERVATION',
    InventoryObservation: 'INVENTORY_OBSERVATION',
  };
  return schema === undefined ? undefined : types[schema];
}

function resourceHrefFromRequest(operationId: string, request: PrincipalRequest, resourceId: string | undefined): string | undefined {
  const path = request.url.split('?')[0] ?? request.url;
  const params = isRecord(request.params) ? request.params : {};
  const pathId = typeof params.id === 'string' ? params.id : typeof params.operationId === 'string' ? params.operationId : undefined;
  const collectionProjects: Readonly<Record<string, string>> = {
    createCustomer: '/api/v1/customers',
    createProduct: '/api/v1/products',
    createSku: '/api/v1/skus',
    createOrder: '/api/v1/orders',
    createInventoryReservation: '/api/v1/inventory/reservations',
    createInventoryObservation: '/api/v1/inventory/observations',
    createInitialReceipt: '/api/v1/inventory/operations',
    createInventoryReceipt: '/api/v1/inventory/operations',
    createInventoryAdjustment: '/api/v1/inventory/operations',
    issueInventory: '/api/v1/inventory/operations',
    reverseInventoryOperation: '/api/v1/inventory/operations',
    createPayment: '/api/v1/payments',
    createUploadIntent: '/api/v1/files',
    createDocument: '/api/v1/documents',
    createTask: '/api/v1/tasks',
  };
  if (operationId === 'createUser' && pathId !== undefined && resourceId !== undefined) return `/api/v1/organizations/${pathId}/users/${resourceId}`;
  const collection = collectionProjects[operationId];
  if (collection !== undefined && resourceId !== undefined) return `${collection}/${resourceId}`;
  const actionSuffixes: Readonly<Record<string, string>> = {
    updateUserRoleBindings: '/role-bindings',
    updateUserDataScopeGrants: '/data-scope-grants',
    disableUser: '/disable',
    transitionOrder: '/transitions',
    releaseInventoryReservation: '/release',
    reverseInventoryOperation: '/reverse',
    submitCustomerApproval: '/submit-approval',
    approveCustomer: '/approve',
    rejectCustomer: '/reject',
    reassignCustomer: '/reassign',
    attachPaymentProof: '/proofs',
    submitPaymentReview: '/submit-review',
    reviewPayment: '/review',
    reversePayment: '/reverse',
    completeUpload: '/complete',
    createDocumentVersion: '/versions',
    submitDocument: '/submit',
    approveDocument: '/approve',
    rejectDocument: '/reject',
    finalizeDocument: '/finalize',
    issueDocument: '/issue',
    voidDocument: '/void',
    completeTask: '/complete',
  };
  const suffix = actionSuffixes[operationId];
  const resourcePath = suffix !== undefined && path.endsWith(suffix) ? path.slice(0, -suffix.length) : path;
  return resourcePath.startsWith('/api/v1/') ? resourcePath : undefined;
}

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
