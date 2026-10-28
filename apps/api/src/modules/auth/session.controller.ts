import { Controller, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { buildProblem, normalizeRequestId, ProblemError } from '../../common/http/problem.js';

@Controller('auth')
export class SessionController {
  @Post('sessions')
  createSession(@Req() request: FastifyRequest): never {
    throw new ProblemError(buildProblem({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      title: 'Authentication provider unavailable',
      requestId: normalizeRequestId(request.headers['x-request-id']),
      retryable: true,
    }));
  }
}
