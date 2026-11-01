import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import { AppModule } from './app.module.js';
import { ProblemExceptionFilter } from './common/http/problem.filter.js';
import { loadRuntimeConfig, type RuntimeConfig } from './config/runtime-config.js';
import { RequestSafetyGuard } from './common/security/request-safety.guard.js';
import { AuthenticationGuard } from './modules/identity/transport/authentication.guard.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { createContractValidator } from '../../../packages/contracts/openapi/runtime-validator.js';
import { ContractResponseValidationInterceptor } from './common/http/contract-response.interceptor.js';
import { normalizeRequestId } from './common/http/problem.js';
import { IdempotencyExecutionInterceptor } from './common/security/idempotency-execution.interceptor.js';
import { IDEMPOTENCY_REPOSITORY } from './modules/integration/idempotency/postgres-idempotency-repository.js';
import { FilesService } from './modules/files/application/files.service.js';
import type { AuthenticationProvider } from './modules/identity/application/session.service.js';
import { createV2RuntimeValidator } from '../../../packages/contracts/openapi/v2/runtime-validator.js';

export async function createApp(options: { config?: RuntimeConfig; env?: Record<string, string | undefined>; authenticationProvider?: AuthenticationProvider } = {}): Promise<NestFastifyApplication> {
  const config = options.config ?? loadRuntimeConfig(options.env);
  const contractDocument = parse(await readFile(join(process.cwd(), 'packages/contracts/openapi/openapi.yaml'), 'utf8')) as Record<string, unknown>;
  const v2ContractDocument = parse(await readFile(join(process.cwd(), 'packages/contracts/openapi/v2/openapi.yaml'), 'utf8')) as Record<string, unknown>;
  const contractValidator = createContractValidator(contractDocument);
  const v2ContractValidator = createV2RuntimeValidator(v2ContractDocument);
  const app = await NestFactory.create<NestFastifyApplication>(AppModule.register(config, contractValidator, v2ContractValidator, options.authenticationProvider), new FastifyAdapter({ logger: false }));
  await app.register(cookie as unknown as Parameters<typeof app.register>[0]);
  app.setGlobalPrefix('api/v1', { exclude: [{ path: 'api/v2/{*path}', method: RequestMethod.ALL }] });
  app.useGlobalFilters(new ProblemExceptionFilter(contractValidator, v2ContractValidator));
  app.useGlobalGuards(app.get(AuthenticationGuard), app.get(RequestSafetyGuard));
  const files = app.get(FilesService);
  app.useGlobalInterceptors(
    new ContractResponseValidationInterceptor(contractValidator, v2ContractValidator),
    new IdempotencyExecutionInterceptor(app.get(IDEMPOTENCY_REPOSITORY), contractValidator, async (operationId, principal, request, stored) => {
      if (operationId !== 'createUploadIntent') return undefined;
      const fileId = stored.resource?.type === 'FILE' ? stored.resource.id : undefined;
      if (fileId === undefined) return undefined;
      return files.replayUploadIntent(principal, fileId, normalizeRequestId(request.headers['x-request-id']), stored);
    }),
  );
  return app;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const app = await createApp();
    await app.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1');
  } catch (error) {
    process.stderr.write(error instanceof Error ? `${error.message}\n` : 'Unable to start API.\n');
    process.exitCode = 1;
  }
}
