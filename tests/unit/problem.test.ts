import {
  buildProblem,
  ProblemError,
  validateProblemMeta,
} from '../../apps/api/src/common/http/problem.js';
import { problemForBackend } from '../../apps/api/src/common/http/backend-controller.js';

describe('RFC 9457 problem foundation', () => {
  const request = { headers: {} } as never;

  it('uses one explicit outcome classification for dependency and unknown failures', () => {
    for (const [status, code] of [[502, 'DEPENDENCY_FAILURE'], [503, 'DEPENDENCY_UNAVAILABLE']] as const) {
      const dependency = buildProblem({
        status,
        code,
        title: 'Dependency unavailable',
        requestId: 'f8b6e3a9-3a0a-4c1c-b3f3-5d65d08c17e2',
        retryable: false,
      });
      const dependencyError = new ProblemError(dependency, 'TERMINAL');
      expect(dependencyError.disposition).toBe('RECOVERABLE');
      expect(dependency.retryable).toBe(true);
    }

    const unknownError = problemForBackend(new Error('temporary database disconnect'), request);
    expect(unknownError.disposition).toBe('RECOVERABLE');
    expect(unknownError.problem).toMatchObject({ status: 500, code: 'INTERNAL_ERROR', retryable: true });

    const responseContractError = new ProblemError(buildProblem({
      status: 500,
      code: 'INTERNAL_ERROR',
      title: 'Response contract validation failed',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3f3-5d65d08c17e2',
      retryable: false,
    }));
    expect(responseContractError.disposition).toBe('TERMINAL');
    expect(responseContractError.problem.retryable).toBe(false);
  });

  it('builds a safe typed inventory problem without leaking implementation details', () => {
    const problem = buildProblem({
      status: 409,
      code: 'INVENTORY_INSUFFICIENT',
      title: '库存不足',
      detail: '一个或多个 SKU 的可用库存不足。',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      meta: {
        shortages: [
          { skuId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019', requested: '3', available: '1', unit: 'PCS' },
        ],
      },
    });

    expect(problem).toMatchObject({
      type: 'urn:autoflow:problem:inventory-insufficient',
      status: 409,
      code: 'INVENTORY_INSUFFICIENT',
      retryable: false,
    });
    expect(JSON.stringify(problem)).not.toMatch(/sql|stack|object[_ ]?key|password|token/i);
    expect(validateProblemMeta(problem.code, problem.meta)).toBe(true);
  });

  it('rejects typed metadata that does not satisfy its fail-closed contract', () => {
    expect(() => validateProblemMeta('VERSION_CONFLICT', { currentVersion: 2 })).toThrow(
      ProblemError,
    );
    expect(() => validateProblemMeta('INVENTORY_INSUFFICIENT', { shortages: [{ requested: 1 }] })).toThrow(
      ProblemError,
    );
    expect(() => buildProblem({
      status: 409,
      code: 'VERSION_CONFLICT',
      title: 'Version conflict',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
    })).toThrow(ProblemError);
    expect(() => buildProblem({
      status: 400,
      code: 'CSRF_FAILED',
      title: 'CSRF failed',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
      meta: { refreshHref: '/api/v1/auth/csrf' },
    })).toThrow(ProblemError);
    expect(() => buildProblem({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      title: 'Dependency unavailable',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
    })).not.toThrow();
    expect(() => buildProblem({
      status: 500,
      code: 'DEPENDENCY_UNAVAILABLE',
      title: 'Dependency unavailable',
      requestId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2',
    })).toThrow(ProblemError);
  });
});
