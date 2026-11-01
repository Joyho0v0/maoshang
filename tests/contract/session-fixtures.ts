export const sessionUserId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
export const sessionOrganizationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';

export const sessionFixture = {
  user: {
    id: sessionUserId,
    organizationId: sessionOrganizationId,
    version: 1,
    href: `/api/v1/users/${sessionUserId}`,
    data: {
      resourceType: 'USER',
      name: 'Alice',
      organizationId: sessionOrganizationId,
    },
  },
  organizationId: sessionOrganizationId,
  capabilities: ['customers.read', 'customers.write'],
  scopeSummary: {
    organizationId: sessionOrganizationId,
    scope: 'organization',
  },
  csrfToken: 'csrf-token-value-123',
  authzVersion: 3,
  sessionEpoch: 7,
} as const;

export type SessionFixture = typeof sessionFixture;

export function withSessionMutation(mutation: (session: Record<string, unknown>) => void): Record<string, unknown> {
  const session = structuredClone(sessionFixture) as unknown as Record<string, unknown>;
  mutation(session);
  return session;
}
