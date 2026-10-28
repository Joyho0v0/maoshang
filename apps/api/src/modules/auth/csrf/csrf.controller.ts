import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CsrfService } from './csrf.service.js';

@Controller('auth')
export class CsrfController {
  constructor(@Inject(CsrfService) private readonly csrf: CsrfService) {}

  @Get('csrf')
  getToken(@Req() request: FastifyRequest, @Res() reply: FastifyReply): void {
    const sessionKey = request.cookies?.session_id ?? `anonymous:${request.ip}`;
    reply.header('cache-control', 'no-store').send(this.csrf.bootstrap(sessionKey));
  }
}
