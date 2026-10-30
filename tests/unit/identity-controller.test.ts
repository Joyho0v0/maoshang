import { describe, expect, it, vi } from 'vitest';
import { IdentityController } from '../../apps/api/src/modules/identity/transport/identity.controller.js';
import { setIdempotencyTransaction } from '../../apps/api/src/common/security/idempotency-transaction-context.js';
import type { AuthorizationPrincipal } from '../../apps/api/src/modules/identity/domain/authz.js';

const principal: AuthorizationPrincipal = {
  userId: '00000000-0000-4000-8000-000000000011',
  organizationId: '00000000-0000-4000-8000-000000000001',
  status: 'ACTIVE',
  permissions: new Set(),
  scopes: new Map(),
  authzVersion: 1,
  sessionEpoch: 1,
};

describe('identity controller idempotency response', () => {
  it('uses the repository claim identity for an accepted disable command', async () => {
    const service = { queueDisableUser: vi.fn().mockResolvedValue(undefined) };
    const controller = new IdentityController(service as never);
    const request = {
      method: 'POST',
      url: '/api/v1/users/00000000-0000-4000-8000-000000000012/disable',
      headers: { 'x-request-id': '00000000-0000-4000-8000-000000000099' },
      user: principal,
    };
    const claim = {
      commandId: '00000000-0000-4000-8000-000000000091',
      operationId: 'disableUser',
      state: 'IN_PROGRESS' as const,
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: null,
      expiresAt: '2026-01-01T00:01:00.000Z',
      retryAfterMs: 3000,
      httpStatus: null,
      resource: null,
      resultHref: null,
      problem: null,
      attemptCount: 1,
      claimRole: 'OWNER' as const,
      ownerToken: Buffer.alloc(32, 7),
    };
    setIdempotencyTransaction(request, { client: {} as never, claim });
    const reply = {
      code: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
    };
    const result = await controller.disableUser(request as never, '00000000-0000-4000-8000-000000000012', '"v1"', reply as never);
    expect(result).toMatchObject({ commandId: claim.commandId, operationId: claim.operationId, startedAt: claim.startedAt, expiresAt: claim.expiresAt, retryAfterMs: claim.retryAfterMs });
    expect(service.queueDisableUser).toHaveBeenCalledWith(principal, '00000000-0000-4000-8000-000000000012', 1, '00000000-0000-4000-8000-000000000099', expect.objectContaining({ commandId: claim.commandId, ownerToken: claim.ownerToken }), {});
  });
});
