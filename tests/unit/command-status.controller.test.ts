import { describe, expect, it, vi } from 'vitest';
import { CommandStatusController } from '../../apps/api/src/modules/integration/command-status/command-status.controller.js';

describe('command status principal boundary', () => {
  it('uses the canonical authenticated principal userId when reading a command', async () => {
    const service = { getByKey: vi.fn().mockResolvedValue({
      commandId: '00000000-0000-4000-8000-000000000091',
      operationId: 'createUser',
      state: 'SUCCEEDED',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      expiresAt: '2026-01-02T00:00:00.000Z',
      retryAfterMs: 0,
      httpStatus: 201,
      resource: { type: 'USER', id: '00000000-0000-4000-8000-000000000092', href: '/api/v1/users/00000000-0000-4000-8000-000000000092' },
      resultHref: null,
      problem: null,
    }) };
    const controller = new CommandStatusController(service as never);
    await controller.getStatus({
      user: { userId: '00000000-0000-4000-8000-000000000011', organizationId: '00000000-0000-4000-8000-000000000001' },
      headers: {},
    } as never, { header: vi.fn().mockReturnThis() } as never, 'key-1', 'createUser');

    expect(service.getByKey).toHaveBeenCalledWith({
      actorId: '00000000-0000-4000-8000-000000000011',
      organizationId: '00000000-0000-4000-8000-000000000001',
      operationId: 'createUser',
      idempotencyKey: 'key-1',
    });
  });
});
