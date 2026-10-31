import { Body, Controller, Delete, Get, Inject, Post, Req, Res } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { FastifyReply } from 'fastify';
import { buildProblem, normalizeRequestId, ProblemError } from '../../common/http/problem.js';
import { problemForBackend } from '../../common/http/backend-controller.js';
import { AuthenticationProviderUnavailableError, InvalidCredentialsError, LoginAttemptLimiter, SessionExpiredError, SessionService, type LoginAttemptKeys } from '../identity/application/session.service.js';
import type { SessionCredentials, SessionDocument } from '../identity/application/types.js';
import type { RuntimeConfig } from '../../config/runtime-config.js';

@Controller('auth')
export class SessionController {
  constructor(
    private readonly sessions: SessionService,
    @Inject('RUNTIME_CONFIG') private readonly config: RuntimeConfig,
    @Inject(LoginAttemptLimiter) private readonly loginLimiter: LoginAttemptLimiter,
  ) {}

  @Post('sessions')
  async createSession(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply, @Body() body: SessionCredentials): Promise<SessionDocument> {
    const keys = loginKeys(request, body);
    const allowance = await this.loginLimiter.check(keys);
    if (!allowance.allowed) {
      reply.header('retry-after', String(allowance.retryAfterSeconds));
      throw this.toProblem(new LoginRateLimitedError(allowance.retryAfterSeconds), request);
    }
    try {
      const created = await this.sessions.createSession(body, normalizeRequestId(request.headers['x-request-id']));
      try {
        await this.loginLimiter.recordSuccess(keys.account);
      } catch {
        // Keep a valid authentication response independent from best-effort
        // limiter cleanup; the IP bucket remains active for the window.
      }
      reply
        .header('cache-control', 'no-store')
        .setCookie('session_id', created.sessionToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: this.config.nodeEnv === 'production',
          path: '/',
        });
      return created.document;
    } catch (error) {
      throw this.toProblem(error, request);
    }
  }

  @Get('sessions/current')
  async getCurrentSession(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<SessionDocument> {
    reply.header('cache-control', 'no-store');
    const sessionToken = request.cookies?.session_id;
    if (typeof sessionToken !== 'string' || sessionToken.length === 0) throw this.toProblem(new SessionExpiredError(), request);
    try {
      return await this.sessions.getCurrentSession(sessionToken);
    } catch (error) {
      throw this.toProblem(error, request);
    }
  }

  @Delete('sessions/current')
  async deleteCurrentSession(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<void> {
    const sessionToken = request.cookies?.session_id;
    if (typeof sessionToken === 'string') await this.sessions.deleteSession(sessionToken);
    reply.clearCookie('session_id', { httpOnly: true, sameSite: 'lax', secure: this.config.nodeEnv === 'production', path: '/' }).code(204);
  }

  private toProblem(error: unknown, request: FastifyRequest): ProblemError {
    const requestId = normalizeRequestId(request.headers['x-request-id']);
    if (error instanceof ProblemError) return error;
    if (error instanceof AuthenticationProviderUnavailableError) return new ProblemError(buildProblem({ status: 503, code: 'DEPENDENCY_UNAVAILABLE', title: 'Authentication provider unavailable', requestId, retryable: true }));
    if (error instanceof LoginRateLimitedError) return new ProblemError(buildProblem({ status: 429, code: 'RATE_LIMITED', title: 'Too many authentication attempts', requestId, retryable: true }));
    if (error instanceof InvalidCredentialsError) return new ProblemError(buildProblem({ status: 401, code: 'INVALID_CREDENTIALS', title: 'Invalid credentials', requestId, retryable: false }));
    if (error instanceof SessionExpiredError) return new ProblemError(buildProblem({ status: 401, code: 'SESSION_EXPIRED', title: 'Session expired', requestId, retryable: false }));
    return problemForBackend(error, request);
  }
}

export class LoginRateLimitedError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Authentication attempts are temporarily rate limited.');
    this.name = 'LoginRateLimitedError';
  }
}

function loginKeys(request: FastifyRequest, body: SessionCredentials): LoginAttemptKeys {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '<anonymous>';
  return { ip: `${body.provider}:${request.ip}`, account: `${body.provider}:${username}` };
}
