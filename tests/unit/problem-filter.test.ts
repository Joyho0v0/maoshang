import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { buildProblem, ProblemError } from '../../apps/api/src/common/http/problem.js';
import { ProblemExceptionFilter } from '../../apps/api/src/common/http/problem.filter.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

interface FilterState {
  status?: number;
  contentType?: string;
  body?: unknown;
  headers: Record<string, string>;
}

function hostFor(request: Record<string, unknown>, state: FilterState) {
  const response = {
    header(name: string, value: string) {
      state.headers[name] = value;
      return response;
    },
    getHeader(name: string) {
      return state.headers[name];
    },
    status(value: number) {
      state.status = value;
      return response;
    },
    type(value: string) {
      state.contentType = value;
      return response;
    },
    send(value: unknown) {
      state.body = value;
      return response;
    },
  };
  return { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;
}

describe('problem exception operation boundary', () => {
  it('validates and preserves a declared createSession dependency response', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const state: FilterState = { headers: {} };
    filter.catch(new ProblemError(buildProblem({ status: 503, code: 'DEPENDENCY_UNAVAILABLE', title: 'Authentication provider unavailable', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true })), hostFor({ method: 'POST', url: '/api/v1/auth/sessions', routeOptions: { url: '/api/v1/auth/sessions' }, headers: {} }, state));
    expect(state.status).toBe(503);
    expect(state.contentType).toBe('application/problem+json');
    expect(state.body).toMatchObject({ status: 503, code: 'DEPENDENCY_UNAVAILABLE' });
  });

  it('replaces a problem whose status is absent from the operation contract with a validated internal error', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const exception = new ProblemError(buildProblem({ status: 503, code: 'DEPENDENCY_UNAVAILABLE', title: 'Temporary dependency failure', requestId: 'f8b6e3a9-3a0a-4c1c-b3f3-5d65d08c17e2', retryable: true }));
    (exception.problem as { status: number }).status = 418;
    const state: FilterState = { headers: {} };
    filter.catch(exception, hostFor({ method: 'POST', url: '/api/v1/auth/sessions', routeOptions: { url: '/api/v1/auth/sessions' }, headers: {} }, state));
    expect(state.status).toBe(500);
    expect(state.body).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });

  it('rejects a permission problem on the CSRF-only createSession response', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const state: FilterState = { headers: {} };
    filter.catch(new ProblemError(buildProblem({ status: 403, code: 'PERMISSION_DENIED', title: 'Permission denied', requestId: 'f8b6e3a9-3a0a-4c1c-b3f3-8a8225e7f019', retryable: false })), hostFor({ method: 'POST', url: '/api/v1/auth/sessions', routeOptions: { url: '/api/v1/auth/sessions' }, headers: {} }, state));
    expect(state.status).toBe(500);
    expect(state.body).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });

  it('requires the operation-specific CSRF meta refresh href', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    for (const meta of [undefined, { refreshHref: '/api/v1/auth/other' }]) {
      const state: FilterState = { headers: {} };
      filter.catch(new ProblemError({
        type: 'urn:autoflow:problem:csrf-failed',
        title: 'CSRF failed',
        status: 403,
        code: 'CSRF_FAILED',
        requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
        retryable: true,
        ...(meta === undefined ? {} : { meta }),
      } as never), hostFor({ method: 'POST', url: '/api/v1/auth/sessions', routeOptions: { url: '/api/v1/auth/sessions' }, headers: {} }, state));
      expect(state.status).toBe(500);
      expect(state.body).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
    }
  });

  it('preserves a valid operation-specific CSRF problem and refresh href', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const state: FilterState = { headers: {} };
    filter.catch(new ProblemError(buildProblem({ status: 403, code: 'CSRF_FAILED', title: 'CSRF failed', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true, meta: { refreshHref: '/api/v1/auth/csrf' } })), hostFor({ method: 'POST', url: '/api/v1/auth/sessions', routeOptions: { url: '/api/v1/auth/sessions' }, headers: {} }, state));
    expect(state.status).toBe(403);
    expect(state.body).toMatchObject({ status: 403, code: 'CSRF_FAILED', meta: { refreshHref: '/api/v1/auth/csrf' } });
  });

  it('preserves permission-denied problems for every representative authorization-capable mutation', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const requests = [
      { method: 'POST', url: '/api/v1/organizations/:id/users', routeOptions: { url: '/api/v1/organizations/:id/users' }, headers: {} },
      { method: 'POST', url: '/api/v1/customers', routeOptions: { url: '/api/v1/customers' }, headers: {} },
      { method: 'POST', url: '/api/v1/inventory/operations/:operationId/reverse', routeOptions: { url: '/api/v1/inventory/operations/:operationId/reverse' }, headers: {} },
      { method: 'POST', url: '/api/v1/files/:id/download-intents', routeOptions: { url: '/api/v1/files/:id/download-intents' }, headers: {} },
    ];
    const problems = [
      buildProblem({ status: 403, code: 'CSRF_FAILED', title: 'CSRF failed', requestId, retryable: true, meta: { refreshHref: '/api/v1/auth/csrf' } }),
      buildProblem({ status: 403, code: 'PERMISSION_DENIED', title: 'Permission denied', requestId, retryable: false }),
    ];
    for (const request of requests) {
      for (const problem of problems) {
        const state: FilterState = { headers: {} };
        filter.catch(new ProblemError(problem), hostFor(request, state));
        expect(state.status).toBe(403);
        expect(state.body).toMatchObject({ status: 403, code: problem.code });
      }
    }
  });

  it('emits the required Retry-After value for a declared rate-limit response', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const state: FilterState = { headers: {} };
    filter.catch(new ProblemError(buildProblem({ status: 429, code: 'RATE_LIMITED', title: 'Rate limited', requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', retryable: true })), hostFor({ method: 'GET', url: '/api/v1/products', routeOptions: { url: '/api/v1/products' }, headers: {} }, state));
    expect(state.status).toBe(429);
    expect(state.headers['Retry-After']).toBe('60');
  });
});
