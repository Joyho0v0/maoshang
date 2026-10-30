import { Controller, Get, Headers, Inject, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { buildProblem, normalizeRequestId, ProblemError } from '../../../common/http/problem.js';
import { CommandStatusService } from './command-status.service.js';
import type { AuthorizationPrincipal } from '../../identity/domain/authz.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: AuthorizationPrincipal;
}

@Controller('commands')
export class CommandStatusController {
  constructor(@Inject(CommandStatusService) private readonly service: CommandStatusService) {}

  @Get('status')
  async getStatus(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply, @Headers('idempotency-key') idempotencyKey?: string, @Headers('x-command-operation') operationId?: string): Promise<unknown> {
    reply.header('cache-control', 'no-store');
    const user = request.user;
    if (user === undefined) {
      throw new ProblemError(buildProblem({ status: 401, code: 'AUTHENTICATION_REQUIRED', title: 'Authentication required', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
    }
    if (idempotencyKey === undefined || operationId === undefined) {
      throw new ProblemError(buildProblem({ status: 400, code: 'VALIDATION_FAILED', title: 'Validation failed', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false, meta: { violations: [{ field: 'headers', code: 'REQUIRED', message: 'Idempotency-Key and X-Command-Operation are required.' }] } }));
    }
    const status = await this.service.getByKey({ actorId: user.userId, organizationId: user.organizationId, operationId, idempotencyKey });
    if (status === undefined) {
      throw new ProblemError(buildProblem({ status: 404, code: 'COMMAND_NOT_FOUND', title: 'Command not found', requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
    }
    return status;
  }
}
