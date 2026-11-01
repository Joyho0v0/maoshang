import type { FastifyRequest } from 'fastify';
import { operations, type OperationId, type OperationInputMap } from '../../../../../packages/contracts/openapi/v2/client.js';
import type { RuntimeValidator } from '../../../../../packages/contracts/openapi/v2/runtime-validator.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../../common/http/problem.js';

type V2Parameter = { readonly name: string; readonly in: 'path' | 'query' | 'header'; readonly required?: boolean; readonly schema?: object };
type V2ResponseContract = { readonly schema?: string; readonly headers?: Readonly<Record<string, { readonly required?: boolean; readonly schema?: object }>> };
export type V2Operation = (typeof operations)[OperationId] & { readonly requestSchema?: string; readonly parameters?: readonly V2Parameter[]; readonly responses: Readonly<Record<string, V2ResponseContract>> };

export function v2OperationForRequest(request: FastifyRequest): V2Operation | undefined {
  const route = request.routeOptions.url ?? request.url.split('?')[0] ?? '';
  const path = route.replace(/^\/api\/v2/, '').replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
  return (Object.values(operations) as V2Operation[]).find((candidate) => candidate.method === request.method.toUpperCase() && candidate.path === path);
}

export function isV2Request(request: FastifyRequest): boolean {
  return (request.url.split('?')[0] ?? request.url).startsWith('/api/v2/');
}

export function validateV2Request(request: FastifyRequest, operation: V2Operation, validator: RuntimeValidator): void {
  const params = request.params as Record<string, unknown> | undefined;
  const query = request.query as Record<string, unknown> | undefined;
  const headers = request.headers as Record<string, unknown>;
  const violations: Array<{ field: string; code: string; message: string }> = [];
  const queryParameters = (operation.parameters ?? []).filter((parameter) => parameter.in === 'query') as readonly V2Parameter[];
  const declaredQueries = new Set(queryParameters.map((parameter) => parameter.name));
  for (const name of Object.keys(query ?? {})) {
    if (!declaredQueries.has(name)) violations.push({ field: name, code: 'UNKNOWN_QUERY_PARAMETER', message: `Unknown query parameter: ${name}` });
  }
  for (const parameter of (operation.parameters ?? []) as readonly V2Parameter[]) {
    const container = parameter.in === 'path' ? params : parameter.in === 'query' ? query : headers;
    const raw = parameter.in === 'header' ? findHeader(headers, parameter.name) : container?.[parameter.name];
    if (raw === undefined) {
      if (parameter.required) violations.push({ field: parameter.name, code: 'MISSING_PARAMETER', message: `Missing ${parameter.in} parameter: ${parameter.name}` });
      continue;
    }
    if (parameter.in === 'query' && Array.isArray(raw)) {
      violations.push({ field: parameter.name, code: 'DUPLICATE_QUERY_PARAMETER', message: `Duplicate query parameter: ${parameter.name}` });
      continue;
    }
    if (parameter.in === 'header' && typeof raw !== 'string') violations.push({ field: parameter.name, code: 'INVALID_HEADER', message: `Invalid header: ${parameter.name}` });
    const schemaValue = parameter.in === 'query' && parameter.name === 'page[size]' && typeof raw === 'string' && /^[0-9]+$/.test(raw) ? Number(raw) : raw;
    if (parameter.schema !== undefined && !validator.validateSchema(parameter.schema, schemaValue)) violations.push({ field: parameter.name, code: 'INVALID_PARAMETER', message: `Invalid ${parameter.in} parameter: ${parameter.name}` });
  }
  const declaredHeaders = new Set((operation.parameters ?? [] as readonly V2Parameter[]).filter((parameter) => parameter.in === 'header').map((parameter) => parameter.name.toLowerCase()));
  for (const name of Object.keys(headers)) if (name !== 'host' && name !== 'content-type' && name !== 'content-length' && !declaredHeaders.has(name.toLowerCase()) && name.startsWith('x-')) violations.push({ field: name, code: 'UNKNOWN_HEADER', message: `Unknown header: ${name}` });
  if (operation.requestSchema !== undefined && !validator.validate(operation.requestSchema, request.body)) violations.push({ field: 'body', code: 'INVALID_BODY', message: `Invalid ${operation.requestSchema} request body` });
  if (operation.requestSchema === undefined && request.body !== undefined && request.body !== null) violations.push({ field: 'body', code: 'BODY_NOT_ALLOWED', message: 'Operation does not accept a request body' });
  if (violations.length > 0) throw new ProblemError(buildProblem({ status: 400, code: 'VALIDATION_FAILED', title: 'Validation failed', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false, violations }));
}

export function requiredSafetyHeader(operation: V2Operation, name: string): boolean {
  return (operation.parameters ?? [] as readonly V2Parameter[]).some((parameter) => parameter.in === 'header' && parameter.name.toLowerCase() === name.toLowerCase() && parameter.required === true);
}

export function findHeader(headers: Record<string, unknown>, name: string): string | undefined {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  const value = key === undefined ? undefined : headers[key];
  return Array.isArray(value) ? value[0] : typeof value === 'string' ? value : undefined;
}

export function v2Input(request: FastifyRequest): OperationInputMap[OperationId] {
  return {
    pathParams: (request.params ?? {}) as Record<string, string>,
    query: (request.query ?? {}) as Record<string, string | number | boolean | readonly (string | number | boolean)[] | undefined>,
    headers: Object.fromEntries(Object.entries(request.headers).flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : Array.isArray(value) && typeof value[0] === 'string' ? [[key, value[0]]] : [])),
    ...(request.body === undefined ? {} : { body: request.body }),
  } as OperationInputMap[OperationId];
}

export function validateV2Response(operation: V2Operation, status: number, body: unknown, headers: { get(name: string): string | null }, validator: RuntimeValidator): void {
  const contract = operation.responses[String(status)] as V2ResponseContract | undefined;
  if (contract === undefined) throw new Error(`Undeclared v2 response status ${status}`);
  for (const [name, header] of Object.entries(contract.headers ?? {})) {
    const value = headers.get(name);
    if (value === null && header.required) throw new Error(`Missing required v2 response header ${name}`);
    if (value !== null && header.schema !== undefined && !validator.validateSchema(header.schema, value)) throw new Error(`Invalid v2 response header ${name}`);
  }
  if (contract.schema !== undefined && !validator.validate(contract.schema, body)) throw new Error(`Invalid v2 response schema ${contract.schema}`);
  if (contract.schema === 'OrderV2' || contract.schema === 'OrderPage') validateOrderResponse(body, contract.schema === 'OrderPage');
}

function validateOrderResponse(value: unknown, page: boolean): void {
  const orders = page && isRecord(value) && Array.isArray(value.data) ? value.data : [value];
  for (const order of orders) {
    if (!isRecord(order)) throw new Error('Invalid v2 order projection');
    const terminal = order.status === 'FULFILLED' || order.status === 'CANCELLED' || order.stage === 'CLOSED';
    const capabilities = Array.isArray(order.capabilities) ? order.capabilities : [];
    const transitions = Array.isArray(order.allowedTransitions) ? order.allowedTransitions : [];
    if (terminal && (capabilities.length !== 0 || transitions.length !== 0)) throw new Error('Terminal v2 order must not advertise actions');
    if (!terminal && transitions.some((item) => !isRecord(item) || item.action === undefined)) throw new Error('Invalid v2 order transition projection');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
