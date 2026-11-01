import { describe, expect, it, vi } from 'vitest';
import { SessionController } from '../../apps/api/src/modules/auth/session.controller.js';
import { AuthenticationProviderUnavailableError, InvalidCredentialsError, LoginAttemptLimiter } from '../../apps/api/src/modules/identity/application/session.service.js';

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

  it('marks controller dependency and unknown failures consistently for idempotency recovery', async () => {
    const limiter = new LoginAttemptLimiter({ limit: 5, windowMs: 10_000, now: () => 1_000 });
    const reply = { header: vi.fn().mockReturnThis(), setCookie: vi.fn().mockReturnThis() };
    const request = { ip: '127.0.0.1', headers: {} };
    const credentials = { provider: 'LOCAL_PASSWORD' as const, username: 'temporary@example.test', password: 'secret' };

    const dependencyController = new SessionController({ createSession: vi.fn().mockRejectedValue(new AuthenticationProviderUnavailableError()) } as never, { nodeEnv: 'test' } as never, limiter);
    await expect(dependencyController.createSession(request as never, reply as never, credentials)).rejects.toMatchObject({
      disposition: 'RECOVERABLE',
      problem: { status: 503, code: 'DEPENDENCY_UNAVAILABLE', retryable: true },
    });

    const unknownController = new SessionController({ createSession: vi.fn().mockRejectedValue(new Error('database disconnect')) } as never, { nodeEnv: 'test' } as never, limiter);
    await expect(unknownController.createSession(request as never, reply as never, credentials)).rejects.toMatchObject({
      disposition: 'RECOVERABLE',
      problem: { status: 500, code: 'INTERNAL_ERROR', retryable: true },
    });
  });
});
