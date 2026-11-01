import { describe, expect, it, vi } from 'vitest';
import { IdentityCommandProcessor } from '../../apps/worker/src/identity-command-processor.js';

describe('identity command processor', () => {
  it('applies disable once and completes the idempotency claim with a terminal status', async () => {
    const client = { query: vi.fn().mockResolvedValue({ rowCount: 1, rows: [] }) };
    const store = {
      disableUser: vi.fn().mockResolvedValue({ id: '00000000-0000-4000-8000-000000000012', version: 2 }),
    };
    const repository = {
      withTransaction: vi.fn(async (work: (value: typeof client) => Promise<unknown>) => work(client)),
      complete: vi.fn().mockResolvedValue(undefined),
      fail: vi.fn().mockResolvedValue(undefined),
    };
    const processor = new IdentityCommandProcessor(store as never, repository as never);
    const event = {
      id: '00000000-0000-4000-8000-000000000099',
      topic: 'identity.command.disable_user',
      payload: {
        commandId: '00000000-0000-4000-8000-000000000091',
        operationId: 'disableUser',
        ownerToken: Buffer.alloc(32, 7).toString('base64'),
        startedAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2026-01-02T00:00:00.000Z',
        retryAfterMs: 1000,
        mutation: {
          organizationId: '00000000-0000-4000-8000-000000000001',
          targetUserId: '00000000-0000-4000-8000-000000000012',
          actorUserId: '00000000-0000-4000-8000-000000000011',
          expectedVersion: 1,
          audit: { organizationId: '00000000-0000-4000-8000-000000000001', actorUserId: '00000000-0000-4000-8000-000000000011', action: 'identity.user.disable', resourceType: 'USER', resourceId: '00000000-0000-4000-8000-000000000012', outcome: 'SUCCEEDED', requestId: '00000000-0000-4000-8000-000000000099' },
        },
      },
    };

    await processor.process(event);

    expect(store.disableUser).toHaveBeenCalledOnce();
    expect(repository.complete).toHaveBeenCalledWith(client, '00000000-0000-4000-8000-000000000091', expect.any(Buffer), expect.objectContaining({ status: 202, resource: expect.objectContaining({ type: 'USER', version: 2 }), body: expect.objectContaining({ state: 'SUCCEEDED' }) }));
    expect(repository.fail).not.toHaveBeenCalled();
  });
});
