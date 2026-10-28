import { Controller, Get, Headers, Inject, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { buildProblem, ProblemError } from '../../../common/http/problem.js';
import { CommandStatusService } from './command-status.service.js';

interface AuthenticatedRequest extends FastifyRequest {
  user?: { id: string; organizationId: string };
}

@Controller('commands')
export class CommandStatusController {
  constructor(@Inject(CommandStatusService) private readonly service: CommandStatusService) {}

  @Get('status')
  getStatus(@Req() request: AuthenticatedRequest, @Headers('idempotency-key') idempotencyKey?: string, @Headers('x-command-operation') operationId?: string): unknown {
    const user = request.user;
    if (user === undefined) {
      throw new ProblemError(buildProblem({ status: 401, code: 'AUTHENTICATION_REQUIRED', title: 'Authentication required', requestId: request.id ?? '00000000-0000-4000-8000-000000000000', retryable: false }));
    }
    if (idempotencyKey === undefined || operationId === undefined) {
      throw new ProblemError(buildProblem({ status: 400, code: 'VALIDATION_FAILED', title: 'Validation failed', requestId: request.id ?? '00000000-0000-4000-8000-000000000000', retryable: false, meta: { violations: [{ field: 'headers', code: 'REQUIRED', message: 'Idempotency-Key and X-Command-Operation are required.' }] } }));
    }
    const status = this.service.getByKey({ actorId: user.id, organizationId: user.organizationId, operationId, idempotencyKey });
    if (status === undefined) {
      throw new ProblemError(buildProblem({ status: 404, code: 'COMMAND_NOT_FOUND', title: 'Command not found', requestId: request.id ?? '00000000-0000-4000-8000-000000000000', retryable: false }));
    }
    return status;
  }
}
