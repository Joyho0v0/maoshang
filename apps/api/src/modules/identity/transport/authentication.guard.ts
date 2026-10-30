import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { buildProblem, normalizeRequestId, ProblemError } from '../../../common/http/problem.js';
import { SessionExpiredError, SessionService } from '../application/session.service.js';
import type { SessionDocument } from '../application/types.js';
import type { AuthorizationPrincipal } from '../domain/authz.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthorizationPrincipal;
  session?: SessionDocument;
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const path = request.url.split('?')[0] ?? request.url;
    if (path === '/api/v1/auth/csrf' || (request.method.toUpperCase() === 'POST' && path === '/api/v1/auth/sessions')) return true;

    const sessionToken = request.cookies?.session_id;
    if (typeof sessionToken !== 'string' || sessionToken.length === 0) {
      await this.sessions.recordSecurityAudit?.({ provider: 'REQUEST_SAFETY', outcome: 'DENIED', requestId: normalizeRequestId(request.headers['x-request-id']), reason: 'AUTHENTICATION_REQUIRED' });
      throw this.authenticationProblem(request);
    }
    try {
      const session = await this.sessions.getCurrentSession(sessionToken, normalizeRequestId(request.headers['x-request-id']));
      request.session = session;
      request.user = toPrincipal(session);
      return true;
    } catch (error) {
      if (error instanceof ProblemError) throw error;
      if (error instanceof SessionExpiredError) throw this.sessionExpiredProblem(request);
      throw error;
    }
  }

  private authenticationProblem(request: FastifyRequest): ProblemError {
    return new ProblemError(buildProblem({
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      title: 'Authentication required',
      requestId: normalizeRequestId(request.headers['x-request-id']),
      retryable: false,
    }));
  }

  private sessionExpiredProblem(request: FastifyRequest): ProblemError {
    return new ProblemError(buildProblem({
      status: 401,
      code: 'SESSION_EXPIRED',
      title: 'Session expired',
      requestId: normalizeRequestId(request.headers['x-request-id']),
      retryable: false,
    }));
  }
}

function toPrincipal(session: SessionDocument): AuthorizationPrincipal {
  return {
    userId: session.user.id,
    organizationId: session.organizationId,
    status: session.user.data.status,
    permissions: new Set(session.capabilities),
    scopes: new Map(session.scopeSummary.grants.map((grant) => [grant.resourceType, grant])),
    authzVersion: session.authzVersion,
    sessionEpoch: session.sessionEpoch,
  };
}
