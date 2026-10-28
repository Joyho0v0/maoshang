import { Module } from '@nestjs/common';
import { CsrfController } from './modules/auth/csrf/csrf.controller.js';
import { CsrfService } from './modules/auth/csrf/csrf.service.js';
import { CommandStatusService } from './modules/integration/command-status/command-status.service.js';
import { CommandStatusController } from './modules/integration/command-status/command-status.controller.js';
import { InMemoryIdempotencyStore } from './modules/integration/idempotency/in-memory-idempotency-store.js';

@Module({
  controllers: [CsrfController, CommandStatusController],
  providers: [
    CsrfService,
    InMemoryIdempotencyStore,
    { provide: CommandStatusService, useFactory: (store: InMemoryIdempotencyStore) => new CommandStatusService(store), inject: [InMemoryIdempotencyStore] },
  ],
  exports: [CsrfService, InMemoryIdempotencyStore, CommandStatusService],
})
export class AppModule {}
