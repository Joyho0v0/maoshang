import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import { AppModule } from './app.module.js';
import { ProblemExceptionFilter } from './common/http/problem.filter.js';
import { loadRuntimeConfig, type RuntimeConfig } from './config/runtime-config.js';
import { RequestSafetyGuard } from './common/security/request-safety.guard.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { createContractValidator } from '../../../packages/contracts/openapi/runtime-validator.js';
import { ContractResponseValidationInterceptor } from './common/http/contract-response.interceptor.js';

export async function createApp(options: { config?: RuntimeConfig; env?: Record<string, string | undefined> } = {}): Promise<NestFastifyApplication> {
  const config = options.config ?? loadRuntimeConfig(options.env);
  const app = await NestFactory.create<NestFastifyApplication>(AppModule.register(config), new FastifyAdapter({ logger: false }));
  const contractDocument = parse(await readFile(join(process.cwd(), 'packages/contracts/openapi/openapi.yaml'), 'utf8')) as Record<string, unknown>;
  await app.register(cookie as unknown as Parameters<typeof app.register>[0]);
  app.setGlobalPrefix('api/v1');
  const contractValidator = createContractValidator(contractDocument);
  app.useGlobalFilters(new ProblemExceptionFilter(contractValidator));
  app.useGlobalGuards(app.get(RequestSafetyGuard));
  app.useGlobalInterceptors(new ContractResponseValidationInterceptor(contractValidator));
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
