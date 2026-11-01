import type { PoolClient } from 'pg';
import type { PostgresClaim } from '../../modules/integration/idempotency/postgres-idempotency-repository.js';

export const IDEMPOTENCY_TRANSACTION_CONTEXT = Symbol('idempotency-transaction-context');

export interface IdempotencyTransactionContext {
  client: PoolClient;
  claim: PostgresClaim;
}

type RequestWithIdempotencyTransaction = {
  [IDEMPOTENCY_TRANSACTION_CONTEXT]?: IdempotencyTransactionContext;
};

export function setIdempotencyTransaction(
  request: object,
  context: IdempotencyTransactionContext,
): IdempotencyTransactionContext | undefined {
  const target = request as RequestWithIdempotencyTransaction;
  const previous = target[IDEMPOTENCY_TRANSACTION_CONTEXT];
  target[IDEMPOTENCY_TRANSACTION_CONTEXT] = context;
  return previous;
}

export function restoreIdempotencyTransaction(request: object, previous: IdempotencyTransactionContext | undefined): void {
  const target = request as RequestWithIdempotencyTransaction;
  if (previous === undefined) {
    delete target[IDEMPOTENCY_TRANSACTION_CONTEXT];
  } else {
    target[IDEMPOTENCY_TRANSACTION_CONTEXT] = previous;
  }
}

export function requireIdempotencyTransaction(request: object): IdempotencyTransactionContext {
  const context = (request as RequestWithIdempotencyTransaction)[IDEMPOTENCY_TRANSACTION_CONTEXT];
  if (context === undefined) throw new Error('Idempotent business work requires the repository transaction context.');
  return context;
}
