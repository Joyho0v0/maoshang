import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CsrfService } from './csrf.service.js';
import type { RuntimeConfig } from '../../../config/runtime-config.js';

@Controller('auth')
export class CsrfController {
  constructor(@Inject(CsrfService) private readonly csrf: CsrfService, @Inject('RUNTIME_CONFIG') private readonly config: RuntimeConfig) {}

  @Get('csrf')
  getToken(@Req() request: FastifyRequest, @Res() reply: FastifyReply): void {
    const sessionId = request.cookies?.session_id ?? randomBytes(32).toString('base64url');
    const sessionKey = `session:${sessionId}`;
    if (request.cookies?.session_id === undefined) {
      reply.setCookie('session_id', sessionId, { httpOnly: true, sameSite: 'lax', secure: this.config.nodeEnv === 'production', path: '/' });
    }
    reply.header('cache-control', 'no-store').send(this.csrf.bootstrap(sessionKey));
  }
}
