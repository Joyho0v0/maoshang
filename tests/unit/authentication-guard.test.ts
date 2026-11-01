import { describe, expect, it } from 'vitest';
import { buildProblem, ProblemError } from '../../apps/api/src/common/http/problem.js';
import { AuthenticationGuard } from '../../apps/api/src/modules/identity/transport/authentication.guard.js';
import type { SessionDocument } from '../../apps/api/src/modules/identity/application/types.js';

const document: SessionDocument = {
  user: {
    id: '00000000-0000-4000-8000-000000000011',
    version: 1,
    href: '/api/v1/users/00000000-0000-4000-8000-000000000011',
    data: {
      resourceType: 'USER',
      organizationId: '00000000-0000-4000-8000-000000000001',
      username: 'admin@example.test',
      displayName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  },
  organizationId: '00000000-0000-4000-8000-000000000001',
  capabilities: ['customer.read'],
  scopeSummary: {
    organizationId: '00000000-0000-4000-8000-000000000001',
    grants: [{ resourceType: 'CUSTOMER', scopeType: 'OWN', groupIds: [] }],
  },
  csrfToken: 'csrf-token-value',
  authzVersion: 3,
  sessionEpoch: 7,
};

function context(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('authentication guard', () => {
  it('fails closed without a session cookie and does not hit the store', async () => {
    let calls = 0;
    const guard = new AuthenticationGuard({
      getCurrentSession: async () => {
        calls += 1;
        return document;
      },
    } as never);

    await expect(guard.canActivate(context({ method: 'GET', url: '/api/v1/auth/sessions/current', cookies: {}, headers: {} }))).rejects.toMatchObject({ problem: { code: 'AUTHENTICATION_REQUIRED', status: 401 } });
    expect(calls).toBe(0);
  });

  it('attaches the authoritative principal and session snapshot to a valid request', async () => {
    const request: Record<string, unknown> = { method: 'GET', url: '/api/v1/auth/sessions/current', cookies: { session_id: 'opaque' }, headers: {} };
    const guard = new AuthenticationGuard({ getCurrentSession: async () => document } as never);

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({ userId: document.user.id, organizationId: document.organizationId, authzVersion: 3, sessionEpoch: 7 });
    expect(request.session).toBe(document);
  });

  it('maps expired sessions to the stable session problem without leaking session details', async () => {
    const guard = new AuthenticationGuard({ getCurrentSession: async () => { throw new ProblemError(buildProblem({ status: 401, code: 'SESSION_EXPIRED', title: 'Session expired', requestId: '00000000-0000-4000-8000-000000000001', retryable: false })); } } as never);

    await expect(guard.canActivate(context({ method: 'GET', url: '/api/v1/auth/sessions/current', cookies: { session_id: 'opaque' }, headers: {} }))).rejects.toMatchObject({ problem: { code: 'SESSION_EXPIRED', status: 401 } });
  });
});
