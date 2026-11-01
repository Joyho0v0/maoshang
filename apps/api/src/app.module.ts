import { DynamicModule, Inject, Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';
import type { RuntimeConfig } from './config/runtime-config.js';
import { CsrfController } from './modules/auth/csrf/csrf.controller.js';
import { CsrfService } from './modules/auth/csrf/csrf.service.js';
import { SessionController } from './modules/auth/session.controller.js';
import { CommandStatusService } from './modules/integration/command-status/command-status.service.js';
import { CommandStatusController } from './modules/integration/command-status/command-status.controller.js';
import { InMemoryIdempotencyStore } from './modules/integration/idempotency/in-memory-idempotency-store.js';
import { RequestSafetyGuard } from './common/security/request-safety.guard.js';
import { IDEMPOTENCY_REPOSITORY, PostgresIdempotencyRepository } from './modules/integration/idempotency/postgres-idempotency-repository.js';
import type { ContractValidator } from '../../../packages/contracts/openapi/runtime-validator.js';

@Injectable()
class DatabasePoolProvider implements OnModuleDestroy {
  readonly pool: pg.Pool;

  constructor(@Inject('RUNTIME_CONFIG') config: RuntimeConfig) {
    this.pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Module({
  controllers: [CsrfController, SessionController, CommandStatusController],
  providers: [
    CsrfService,
    { provide: InMemoryIdempotencyStore, useFactory: () => new InMemoryIdempotencyStore() },
    DatabasePoolProvider,
    { provide: IDEMPOTENCY_REPOSITORY, useFactory: (database: DatabasePoolProvider) => new PostgresIdempotencyRepository(database.pool), inject: [DatabasePoolProvider] },
    RequestSafetyGuard,
    { provide: CommandStatusService, useFactory: (repository: PostgresIdempotencyRepository, database: DatabasePoolProvider) => new CommandStatusService(repository, () => database.pool.connect()), inject: [IDEMPOTENCY_REPOSITORY, DatabasePoolProvider] },
  ],
  exports: [CsrfService, InMemoryIdempotencyStore, CommandStatusService, IDEMPOTENCY_REPOSITORY],
})
export class AppModule {
  static register(config: RuntimeConfig, validator: ContractValidator): DynamicModule {
    return {
      module: AppModule,
      providers: [
        { provide: 'RUNTIME_CONFIG', useValue: config },
        { provide: 'CONTRACT_VALIDATOR', useValue: validator },
      ],
      exports: ['RUNTIME_CONFIG', 'CONTRACT_VALIDATOR'],
    };
  }
}
