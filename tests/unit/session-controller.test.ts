import { describe, expect, it, vi } from 'vitest';
import { SessionController } from '../../apps/api/src/modules/auth/session.controller.js';
import { InvalidCredentialsError, LoginAttemptLimiter } from '../../apps/api/src/modules/identity/application/session.service.js';

describe('session controller authentication boundary', () => {
  it('returns the same invalid-credentials response before applying the bounded 429', async () => {
    const sessions = { createSession: vi.fn().mockRejectedValue(new InvalidCredentialsError()) };
    const limiter = new LoginAttemptLimiter({ limit: 1, windowMs: 10_000, now: () => 1_000 });
    const controller = new SessionController(sessions as never, { nodeEnv: 'test' } as never, limiter);
    const reply = { header: vi.fn().mockReturnThis(), setCookie: vi.fn().mockReturnThis() };
    const request = { ip: '127.0.0.1', headers: {} };
    const credentials = { provider: 'LOCAL_PASSWORD' as const, username: 'same@example.test', password: 'wrong' };

    await expect(controller.createSession(request as never, reply as never, credentials)).rejects.toMatchObject({ problem: { status: 401, code: 'INVALID_CREDENTIALS' } });
    await expect(controller.createSession(request as never, reply as never, credentials)).rejects.toMatchObject({ problem: { status: 429, code: 'RATE_LIMITED' } });
    expect(sessions.createSession).toHaveBeenCalledOnce();
    expect(reply.header).toHaveBeenCalledWith('retry-after', expect.any(String));
  });
});
