import { DynamicModule, Inject, Injectable, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
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
import { DisabledAuthenticationProvider, LoginAttemptLimiter, SECURITY_AUDIT_FAILURE_REPORTER, SessionService, type AuthenticationProvider, type IdentityStore, type SecurityAuditFailure, type SecurityAuditFailureReporter } from './modules/identity/application/session.service.js';
import { PostgresIdentityStore } from './modules/identity/infrastructure/postgres-identity.store.js';
import { PostgresLoginAttemptStore } from './modules/identity/infrastructure/postgres-login-attempt.store.js';
import { IdentityCommandService, type IdentityAuditQueryStore, type IdentityMutationStore } from './modules/identity/application/identity-command.service.js';
import { IdentityController } from './modules/identity/transport/identity.controller.js';
import { FilesController } from './modules/files/transport/files.controller.js';
import { FilesService } from './modules/files/application/files.service.js';
import { PostgresFilesStore } from './modules/files/infrastructure/postgres-files.store.js';
import { ControlledFakeObjectStorageAdapter } from './modules/files/infrastructure/file-adapters.js';
import type { ObjectStorageAdapter } from './modules/files/infrastructure/file-adapters.js';
import { CrmController } from './modules/crm/transport/crm.controller.js';
import { CrmService } from './modules/crm/application/crm.service.js';
import { PostgresCrmStore } from './modules/crm/infrastructure/postgres-crm.store.js';
import { CatalogController } from './modules/catalog/transport/catalog.controller.js';
import { CatalogService } from './modules/catalog/application/catalog.service.js';
import { PostgresCatalogStore } from './modules/catalog/infrastructure/postgres-catalog.store.js';
import { OrdersController } from './modules/orders/transport/orders.controller.js';
import { OrdersService } from './modules/orders/application/orders.service.js';
import { PostgresOrdersStore } from './modules/orders/infrastructure/postgres-orders.store.js';

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
  controllers: [CsrfController, SessionController, CommandStatusController, IdentityController, FilesController, CrmController, CatalogController, OrdersController],
  providers: [
    CsrfService,
    {
      provide: SECURITY_AUDIT_FAILURE_REPORTER,
      useFactory: (): SecurityAuditFailureReporter => {
        const logger = new Logger('SecurityAudit');
        return (failure: SecurityAuditFailure) => logger.error(JSON.stringify({ event: 'security_audit_write_failed', ...failure }));
      },
    },
    { provide: LoginAttemptLimiter, useFactory: (database: DatabasePoolProvider, config: RuntimeConfig) => new LoginAttemptLimiter(config.nodeEnv === 'test' ? {} : { store: new PostgresLoginAttemptStore(database.pool) }), inject: [DatabasePoolProvider, 'RUNTIME_CONFIG'] },
    { provide: InMemoryIdempotencyStore, useFactory: () => new InMemoryIdempotencyStore() },
    DatabasePoolProvider,
    { provide: 'IDENTITY_STORE', useFactory: (database: DatabasePoolProvider): IdentityStore & IdentityMutationStore & IdentityAuditQueryStore => new PostgresIdentityStore(database.pool), inject: [DatabasePoolProvider] },
    { provide: IdentityCommandService, useFactory: (store: IdentityMutationStore & IdentityAuditQueryStore) => new IdentityCommandService(store), inject: ['IDENTITY_STORE'] },
    { provide: 'AUTHENTICATION_PROVIDER', useClass: DisabledAuthenticationProvider },
    {
      provide: SessionService,
      useFactory: (store: IdentityStore, provider: AuthenticationProvider, csrf: CsrfService, reportAuditFailure: SecurityAuditFailureReporter) => new SessionService(store, provider, csrf, undefined, reportAuditFailure),
      inject: ['IDENTITY_STORE', 'AUTHENTICATION_PROVIDER', CsrfService, SECURITY_AUDIT_FAILURE_REPORTER],
    },
    AuthenticationGuard,
    { provide: IDEMPOTENCY_REPOSITORY, useFactory: (database: DatabasePoolProvider) => new PostgresIdempotencyRepository(database.pool), inject: [DatabasePoolProvider] },
    RequestSafetyGuard,
    { provide: CommandStatusService, useFactory: (repository: PostgresIdempotencyRepository, database: DatabasePoolProvider) => new CommandStatusService(repository, () => database.pool.connect()), inject: [IDEMPOTENCY_REPOSITORY, DatabasePoolProvider] },
    {
      provide: PostgresFilesStore,
      useFactory: (database: DatabasePoolProvider) => new PostgresFilesStore(database.pool),
      inject: [DatabasePoolProvider],
    },
    {
      provide: 'OBJECT_STORAGE_ADAPTER',
      useFactory: (config: RuntimeConfig): ObjectStorageAdapter => {
        if (config.nodeEnv === 'production') {
          throw new Error('Controlled object storage adapter is disabled in production.');
        }
        return new ControlledFakeObjectStorageAdapter();
      },
      inject: ['RUNTIME_CONFIG'],
    },
    {
      provide: FilesService,
      useFactory: (store: PostgresFilesStore, objectStorage: ObjectStorageAdapter) => new FilesService(store, objectStorage),
      inject: [PostgresFilesStore, 'OBJECT_STORAGE_ADAPTER'],
    },
    {
      provide: PostgresCrmStore,
      useFactory: (database: DatabasePoolProvider) => new PostgresCrmStore(database.pool),
      inject: [DatabasePoolProvider],
    },
    {
      provide: CrmService,
      useFactory: (store: PostgresCrmStore) => new CrmService(store),
      inject: [PostgresCrmStore],
    },
    {
      provide: PostgresCatalogStore,
      useFactory: (database: DatabasePoolProvider) => new PostgresCatalogStore(database.pool),
      inject: [DatabasePoolProvider],
    },
    {
      provide: CatalogService,
      useFactory: (store: PostgresCatalogStore) => new CatalogService(store),
      inject: [PostgresCatalogStore],
    },
    {
      provide: PostgresOrdersStore,
      useFactory: (database: DatabasePoolProvider) => new PostgresOrdersStore(database.pool),
      inject: [DatabasePoolProvider],
    },
    {
      provide: OrdersService,
      useFactory: (store: PostgresOrdersStore) => new OrdersService(store),
      inject: [PostgresOrdersStore],
    },
  ],
  exports: [CsrfService, InMemoryIdempotencyStore, CommandStatusService, IDEMPOTENCY_REPOSITORY, FilesService, PostgresFilesStore, 'OBJECT_STORAGE_ADAPTER', CrmService, CatalogService, OrdersService],
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
