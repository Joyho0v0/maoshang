import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { requireIdempotencyTransaction } from '../../../common/security/idempotency-transaction-context.js';
import { buildProblem, normalizeRequestId, ProblemError } from '../../../common/http/problem.js';
import { formatEtag } from '../../../common/http/etag.js';
import type { AuthenticatedRequest } from '../../identity/transport/authentication.guard.js';
import { FilesService, problemForFileError, toApiFile, type FileCommandRequest, type FileCreateRequest } from '../application/files.service.js';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-intents')
  async createUploadIntent(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply, @Body() body: FileCreateRequest): Promise<unknown> {
    const principal = request.user;
    if (principal === undefined) throw this.problem(401, 'AUTHENTICATION_REQUIRED', 'Authentication required', request);
    const { client } = requireIdempotencyTransaction(request);
    const result = await this.files.createUploadIntent(principal, body, normalizeRequestId(request.headers['x-request-id']), client);
    const href = result.href;
    reply.code(201).header('etag', formatEtag(result.file.version)).header('location', href).header('content-location', href).header('cache-control', 'no-store');
    return { file: toApiFile(result.file, href), href, transfer: result.transfer };
  }

  @Get(':id')
  async getFile(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply, @Param('id') id: string): Promise<unknown> {
    const principal = request.user;
    if (principal === undefined) throw this.problem(401, 'AUTHENTICATION_REQUIRED', 'Authentication required', request);
    try {
      const file = await this.files.getFile(principal, id);
      reply.header('etag', formatEtag(file.version));
      return toApiFile(file, `/api/v1/files/${file.id}`);
    } catch (error) {
      throw this.toProblem(error, request, id);
    }
  }

  @Post(':id/complete')
  async completeUpload(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply, @Param('id') id: string, @Body() body: FileCommandRequest,): Promise<unknown> {
    const principal = request.user;
    if (principal === undefined) throw this.problem(401, 'AUTHENTICATION_REQUIRED', 'Authentication required', request);
    const { client, claim } = requireIdempotencyTransaction(request);
    const result = await this.files.completeUpload(principal, id, body, headerString(request.headers['if-match']), normalizeRequestId(request.headers['x-request-id']), client, claim);
    reply.code(result.status).header('cache-control', 'no-store');
    return result.body;
  }

  @Post(':id/download-intents')
  async createDownloadIntent(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) reply: FastifyReply, @Param('id') id: string): Promise<unknown> {
    const principal = request.user;
    if (principal === undefined) throw this.problem(401, 'AUTHENTICATION_REQUIRED', 'Authentication required', request);
    try {
      const result = await this.files.createDownloadIntent(principal, id, normalizeRequestId(request.headers['x-request-id']));
      reply.header('cache-control', 'no-store');
      return { file: toApiFile(result.file, result.href), href: result.href, transfer: result.transfer };
    } catch (error) {
      throw this.toProblem(error, request, id);
    }
  }

  private toProblem(error: unknown, request: FastifyRequest, fileId?: string): ProblemError {
    const requestId = normalizeRequestId(request.headers['x-request-id']);
    const known = problemForFileError(error, requestId, fileId);
    if (known !== undefined) return new ProblemError(known);
    if (error instanceof ProblemError) return error;
    return this.problem(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }

  private problem(status: number, code: 'AUTHENTICATION_REQUIRED' | 'INTERNAL_ERROR', title: string, request: FastifyRequest): ProblemError {
    return new ProblemError(buildProblem({ status, code, title, requestId: normalizeRequestId(request.headers['x-request-id']), retryable: false }));
  }
}

function headerString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
