import { DynamicModule, Module } from '@nestjs/common';
import type { RuntimeConfig } from './config/runtime-config.js';
import { CsrfController } from './modules/auth/csrf/csrf.controller.js';
import { CsrfService } from './modules/auth/csrf/csrf.service.js';
import { SessionController } from './modules/auth/session.controller.js';
import { CommandStatusService } from './modules/integration/command-status/command-status.service.js';
import { CommandStatusController } from './modules/integration/command-status/command-status.controller.js';
import { InMemoryIdempotencyStore } from './modules/integration/idempotency/in-memory-idempotency-store.js';
import { RequestSafetyGuard } from './common/security/request-safety.guard.js';

@Module({
  controllers: [CsrfController, SessionController, CommandStatusController],
  providers: [
    CsrfService,
    { provide: InMemoryIdempotencyStore, useFactory: () => new InMemoryIdempotencyStore() },
    RequestSafetyGuard,
    { provide: CommandStatusService, useFactory: (store: InMemoryIdempotencyStore) => new CommandStatusService(store), inject: [InMemoryIdempotencyStore] },
  ],
  exports: [CsrfService, InMemoryIdempotencyStore, CommandStatusService],
})
export class AppModule {
  static register(config: RuntimeConfig): DynamicModule {
    return {
      module: AppModule,
      providers: [{ provide: 'RUNTIME_CONFIG', useValue: config }],
      exports: ['RUNTIME_CONFIG'],
    };
  }
}
