import type { components } from '../../packages/contracts/openapi/generated.js';
import { expect, it } from 'vitest';

const id = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' as const;
const base = {
  commandId: id,
  operationId: 'createCustomer',
  startedAt: '2026-10-28T05:00:00Z',
  expiresAt: '2026-10-29T05:00:00Z',
  attemptCount: 1,
};

const inProgress: components['schemas']['CommandStatus'] = {
  ...base,
  state: 'IN_PROGRESS',
  completedAt: null,
  retryAfterMs: 1000,
  httpStatus: null,
  resource: null,
  resultHref: null,
  problem: null,
};

const failed: components['schemas']['CommandStatus'] = {
  ...base,
  state: 'FAILED',
  completedAt: '2026-10-28T05:01:00Z',
  retryAfterMs: 0,
  httpStatus: 409,
  resource: null,
  resultHref: null,
  problem: {
    type: 'urn:autoflow:problem:business-rule-violation',
    title: 'Conflict',
    status: 409,
    code: 'BUSINESS_RULE_VIOLATION',
    requestId: id,
    retryable: false,
  },
};

void inProgress;
void failed;

const invalidInProgress: components['schemas']['CommandStatus'] = {
  ...base,
  state: 'IN_PROGRESS',
  completedAt: '2026-10-28T05:01:00Z',
  retryAfterMs: 1000,
  httpStatus: 201,
  // @ts-expect-error IN_PROGRESS cannot carry a resource reference.
  resource: { type: 'CUSTOMER', id, href: `/api/v1/customers/${id}` },
  // @ts-expect-error IN_PROGRESS cannot carry a result href.
  resultHref: `/api/v1/customers/${id}`,
  problem: null,
};

const invalidFailed: components['schemas']['CommandStatus'] = {
  ...base,
  state: 'FAILED',
  completedAt: '2026-10-28T05:01:00Z',
  retryAfterMs: 0,
  httpStatus: 409,
  // @ts-expect-error FAILED cannot carry a resource reference.
  resource: { type: 'CUSTOMER', id, href: `/api/v1/customers/${id}` },
  // @ts-expect-error FAILED cannot carry a result href.
  resultHref: `/api/v1/customers/${id}`,
  problem: failed.problem,
};

void invalidInProgress;
void invalidFailed;

it('keeps the compile-time CommandStatus fixture loaded', () => {
  expect(inProgress.state).toBe('IN_PROGRESS');
  expect(failed.state).toBe('FAILED');
});
