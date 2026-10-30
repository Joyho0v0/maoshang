import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { GeneratedApiClient } from '../../packages/contracts/openapi/generated-client.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';
import {
  sessionFixture,
  sessionOrganizationId,
  withSessionMutation,
} from './session-fixtures.js';

const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';

async function document(): Promise<Record<string, unknown>> {
  return parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
}

function response(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'x-request-id': requestId,
      'cache-control': 'no-store',
    },
  });
}

describe('required Session identity contract', () => {
  it('accepts the complete identity on createSession 201 and getCurrentSession 200', async () => {
    const validator = createContractValidator(await document());
    for (const [operationId, input, status] of [
      ['createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } }, 201],
      ['getCurrentSession', {}, 200],
    ] as const) {
      const client = new GeneratedApiClient({
        fetch: async () => response(sessionFixture, status),
        validator,
      });

      await expect(client.call(operationId, input as never)).resolves.toMatchObject({
        status,
        data: {
          organizationId: sessionOrganizationId,
          authzVersion: 3,
          sessionEpoch: 7,
        },
      });
    }
  });

  it.each(['user', 'organizationId', 'capabilities', 'scopeSummary', 'csrfToken', 'authzVersion', 'sessionEpoch'])(
    'rejects a Session missing %s before authentication state can be accepted',
    async (field) => {
      const validator = createContractValidator(await document());
      const missing = withSessionMutation((session) => {
        delete session[field];
      });

      expect(validator.validate('Session', missing)).toBe(false);
    },
  );

  it('rejects a Session with an invalid organization UUID', async () => {
    const validator = createContractValidator(await document());
    const invalid = withSessionMutation((session) => {
      session.organizationId = 'not-a-uuid';
    });

    expect(validator.validate('Session', invalid)).toBe(false);
  });

  it.each([0, -1, 1.5, '3'])(
    'rejects invalid authzVersion values before authentication state can be accepted: %s',
    async (value) => {
      const validator = createContractValidator(await document());
      const invalid = withSessionMutation((session) => {
        session.authzVersion = value;
      });

      expect(validator.validate('Session', invalid)).toBe(false);
    },
  );

  it.each([0, -1, 1.5, '7'])(
    'rejects invalid sessionEpoch values before authentication state can be accepted: %s',
    async (value) => {
      const validator = createContractValidator(await document());
      const invalid = withSessionMutation((session) => {
        session.sessionEpoch = value;
      });

      expect(validator.validate('Session', invalid)).toBe(false);
    },
  );

  it('accepts repeated organization identifiers only when every copy agrees with the top-level identity', async () => {
    const validator = createContractValidator(await document());
    const consistent = withSessionMutation((session) => {
      (session.user as Record<string, unknown>).organizationId = sessionOrganizationId;
      ((session.user as Record<string, unknown>).data as Record<string, unknown>).organizationId = sessionOrganizationId;
      (session.scopeSummary as Record<string, unknown>).organizationId = sessionOrganizationId;
    });
    const conflicting = withSessionMutation((session) => {
      (session.user as Record<string, unknown>).organizationId = '7c0c4a64-17c7-4af0-ae10-0cc9a7d5e0f1';
    });

    expect(validator.validate('Session', consistent)).toBe(true);
    expect(validator.validate('Session', conflicting)).toBe(false);
  });
});
