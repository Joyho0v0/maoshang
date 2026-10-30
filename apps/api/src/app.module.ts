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
import { AuthenticationGuard } from './modules/identity/transport/authentication.guard.js';
import { DisabledAuthenticationProvider, LoginAttemptLimiter, SessionService, type AuthenticationProvider, type IdentityStore } from './modules/identity/application/session.service.js';
import { PostgresIdentityStore } from './modules/identity/infrastructure/postgres-identity.store.js';
import { IdentityCommandService, type IdentityAuditQueryStore, type IdentityMutationStore } from './modules/identity/application/identity-command.service.js';
import { IdentityController } from './modules/identity/transport/identity.controller.js';

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
  controllers: [CsrfController, SessionController, CommandStatusController, IdentityController],
  providers: [
    CsrfService,
    { provide: LoginAttemptLimiter, useFactory: () => new LoginAttemptLimiter() },
    { provide: InMemoryIdempotencyStore, useFactory: () => new InMemoryIdempotencyStore() },
    DatabasePoolProvider,
    { provide: 'IDENTITY_STORE', useFactory: (database: DatabasePoolProvider): IdentityStore & IdentityMutationStore & IdentityAuditQueryStore => new PostgresIdentityStore(database.pool), inject: [DatabasePoolProvider] },
    { provide: IdentityCommandService, useFactory: (store: IdentityMutationStore & IdentityAuditQueryStore) => new IdentityCommandService(store), inject: ['IDENTITY_STORE'] },
    { provide: 'AUTHENTICATION_PROVIDER', useClass: DisabledAuthenticationProvider },
    {
      provide: SessionService,
      useFactory: (store: IdentityStore, provider: AuthenticationProvider, csrf: CsrfService) => new SessionService(store, provider, csrf),
      inject: ['IDENTITY_STORE', 'AUTHENTICATION_PROVIDER', CsrfService],
    },
    AuthenticationGuard,
    { provide: IDEMPOTENCY_REPOSITORY, useFactory: (database: DatabasePoolProvider) => new PostgresIdempotencyRepository(database.pool), inject: [DatabasePoolProvider] },
    RequestSafetyGuard,
    { provide: CommandStatusService, useFactory: (repository: PostgresIdempotencyRepository, database: DatabasePoolProvider) => new CommandStatusService(repository, () => database.pool.connect()), inject: [IDEMPOTENCY_REPOSITORY, DatabasePoolProvider] },
  ],
  exports: [CsrfService, InMemoryIdempotencyStore, CommandStatusService, IDEMPOTENCY_REPOSITORY],
})
export class AppModule {
  static register(config: RuntimeConfig, validator: ContractValidator, authenticationProvider?: AuthenticationProvider): DynamicModule {
    return {
      module: AppModule,
      providers: [
        { provide: 'RUNTIME_CONFIG', useValue: config },
        { provide: 'CONTRACT_VALIDATOR', useValue: validator },
        ...(authenticationProvider === undefined ? [] : [{ provide: 'AUTHENTICATION_PROVIDER', useValue: authenticationProvider }]),
      ],
      exports: ['RUNTIME_CONFIG', 'CONTRACT_VALIDATOR'],
    };
  }
}
