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
    const nonString = withSessionMutation((session) => {
      (session.user as Record<string, unknown>).organizationId = { value: sessionOrganizationId };
    });

    expect(validator.validate('Session', consistent)).toBe(true);
    expect(validator.validate('Session', conflicting)).toBe(false);
    expect(validator.validate('Session', nonString)).toBe(false);
  });

  it.each([
    {
      location: 'scopeSummary',
      mutate: (session: Record<string, unknown>, organizationId: unknown) => {
        (session.scopeSummary as Record<string, unknown>).organizations = [{ organizationId }];
      },
    },
    {
      location: 'user.data.lines',
      mutate: (session: Record<string, unknown>, organizationId: unknown) => {
        const user = session.user as Record<string, unknown>;
        const data = user.data as Record<string, unknown>;
        data.lines = [{ organizationId }];
      },
    },
  ])('validates repeated organization identifiers in $location through both generated Session response paths', async ({ mutate }) => {
    const documentValue = await document();
    const operations = [
      ['createSession', { headers: { 'X-CSRF-Token': 'csrf-token-value' }, body: { provider: 'LOCAL_PASSWORD' } }, 201],
      ['getCurrentSession', {}, 200],
    ] as const;
    const conflictingOrganizationId = '7c0c4a64-17c7-4af0-ae10-0cc9a7d5e0f1';

    for (const [operationId, input, status] of operations) {
      const consistentValidator = createContractValidator(documentValue);
      const consistent = withSessionMutation((session) => mutate(session, sessionOrganizationId));
      const consistentClient = new GeneratedApiClient({
        fetch: async () => response(consistent, status),
        validator: consistentValidator,
      });
      await expect(consistentClient.call(operationId, input as never)).resolves.toMatchObject({ status });

      const conflictingValidator = createContractValidator(documentValue);
      const conflicting = withSessionMutation((session) => mutate(session, conflictingOrganizationId));
      const conflictingClient = new GeneratedApiClient({
        fetch: async () => response(conflicting, status),
        validator: conflictingValidator,
      });
      await expect(conflictingClient.call(operationId, input as never)).rejects.toThrow(/Invalid Session response/);

      const nonStringValidator = createContractValidator(documentValue);
      const nonString = withSessionMutation((session) => mutate(session, { id: conflictingOrganizationId }));
      const nonStringClient = new GeneratedApiClient({
        fetch: async () => response(nonString, status),
        validator: nonStringValidator,
      });
      await expect(nonStringClient.call(operationId, input as never)).rejects.toThrow(/Invalid Session response/);
    }
  });
});
