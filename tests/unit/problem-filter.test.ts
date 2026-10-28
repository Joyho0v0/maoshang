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

  it('does not let a generic permission problem bypass the operation-specific CSRF response schema', async () => {
    const document = parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
    const filter = new ProblemExceptionFilter(createContractValidator(document));
    const state: FilterState = { headers: {} };
    filter.catch(new ProblemError(buildProblem({ status: 403, code: 'PERMISSION_DENIED', title: 'Permission denied', requestId: 'f8b6e3a9-3a0a-4c1c-b3f3-8a8225e7f019', retryable: false })), hostFor({ method: 'POST', url: '/api/v1/auth/sessions', routeOptions: { url: '/api/v1/auth/sessions' }, headers: {} }, state));
    expect(state.status).toBe(500);
    expect(state.body).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });
});
