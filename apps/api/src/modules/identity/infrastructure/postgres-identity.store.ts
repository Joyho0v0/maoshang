import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import {
  IdentityUserNotFoundError,
  IdentityVersionConflictError,
  IdentityCursorError,
  type AuditEventPage,
  type AuditQueryFilters,
  type AuditEventInput,
  type CreateUserMutation,
  type DataScopeMutation,
  type DisableUserMutation,
  type DisableCommandClaim,
  type IdentityMutationStore,
  type RoleBindingMutation,
} from '../application/identity-command.service.js';
import type { AuthenticationAuditInput, IdentityStore } from '../application/session.service.js';
import type { DataScopeGrant } from '../domain/authz.js';
import type { AuthorizationPrincipal } from '../domain/authz.js';
import type {
  IdentityUser,
  ProviderIdentity,
  SessionProvider,
  StoredSession,
} from '../application/types.js';

interface UserRow extends QueryResultRow {
  id: string;
  organization_id: string;
  organization_status: 'ACTIVE' | 'DISABLED';
  username_normalized: string;
  display_name: string;
  status: 'ACTIVE' | 'DISABLED';
  version: number | string;
  authz_version: number | string;
  session_epoch: number | string;
  primary_business_group_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SessionRow extends UserRow {
  session_id: string;
  token_hash: Buffer;
  session_organization_id: string;
  session_user_id: string;
  session_authz_version: number | string;
  session_epoch_value: number | string;
  expires_at: Date;
  session_created_at: Date;
}

interface ScopeRow extends QueryResultRow {
  resource_type: string;
  scope_type: 'OWN' | 'GROUP_SET' | 'ALL_ORG';
  group_ids: string[];
}

interface AuditRow extends QueryResultRow {
  id: string;
  organization_id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  outcome: string;
  reason: string | null;
  before_summary: Record<string, unknown>;
  after_summary: Record<string, unknown>;
  trace_id: string | null;
  created_at: Date;
}

export class PostgresIdentityStore implements IdentityStore, IdentityMutationStore {
  constructor(private readonly pool: Pool) {}

  async findUserForProvider(provider: SessionProvider, identity: ProviderIdentity): Promise<IdentityUser | undefined> {
    return this.withClient(async (client) => {
      const result = await client.query<UserRow>(
        `SELECT u.id, u.organization_id, o.status AS organization_status, u.username_normalized, u.display_name, u.status,
                u.version, u.authz_version, u.session_epoch, m.business_group_id AS primary_business_group_id,
                u.created_at, u.updated_at
           FROM iam.user_account AS u
           JOIN org.organization AS o ON o.id = u.organization_id
           LEFT JOIN LATERAL (
             SELECT business_group_id
               FROM org.membership
              WHERE organization_id = u.organization_id AND user_id = u.id
                AND status = 'ACTIVE' AND valid_to IS NULL
              ORDER BY is_primary DESC, id
              LIMIT 1
           ) AS m ON true
          WHERE provider = $1
            AND provider_subject = $2
            AND ($3::text IS NULL OR lower(u.username_normalized) = lower($3))
          ORDER BY u.id`,
        [provider, identity.subject, identity.username ?? null],
      );
      const row = result.rows[0];
      return row === undefined ? undefined : this.loadUser(client, row);
    });
  }

  async createSession(input: Omit<StoredSession, 'createdAt'>): Promise<StoredSession> {
    const tokenHash = decodeHash(input.tokenHash);
    return this.withClient((client) => this.insertSession(client, input, tokenHash));
  }

  async createSessionWithAudit(input: Omit<StoredSession, 'createdAt'>, audit: AuthenticationAuditInput): Promise<StoredSession> {
    const tokenHash = decodeHash(input.tokenHash);
    return this.withTransaction(async (client) => {
      const session = await this.insertSession(client, input, tokenHash);
      await this.appendAuthenticationAudit(client, audit);
      return session;
    });
  }

  private async insertSession(client: PoolClient, input: Omit<StoredSession, 'createdAt'>, tokenHash: Buffer): Promise<StoredSession> {
      const result = await client.query<{
        id: string;
        organization_id: string;
        user_id: string;
        token_hash: Buffer;
        authz_version: number | string;
        session_epoch: number | string;
        expires_at: Date;
        created_at: Date;
      }>(
        `INSERT INTO iam.session
          (id, organization_id, user_id, token_hash, authz_version, session_epoch, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, organization_id, user_id, token_hash, authz_version,
                   session_epoch, expires_at, created_at`,
        [input.id, input.organizationId, input.userId, tokenHash, input.authzVersion, input.sessionEpoch, input.expiresAt],
      );
      const row = result.rows[0];
      if (row === undefined) throw new Error('Session insert returned no row.');
      return {
        id: row.id,
        tokenHash: row.token_hash.toString('hex'),
        userId: row.user_id,
        organizationId: row.organization_id,
        authzVersion: toPositiveInteger(row.authz_version),
        sessionEpoch: toPositiveInteger(row.session_epoch),
        expiresAt: row.expires_at.toISOString(),
        createdAt: row.created_at.toISOString(),
      };
  }

  async findSession(tokenHash: string): Promise<{ session: StoredSession; user: IdentityUser } | undefined> {
    const decodedHash = decodeHash(tokenHash);
    return this.withTransaction(async (client) => {
      const result = await client.query<SessionRow>(
        `SELECT s.id AS session_id, s.organization_id AS session_organization_id,
                s.user_id AS session_user_id, s.token_hash,
                s.authz_version AS session_authz_version,
                s.session_epoch AS session_epoch_value, s.expires_at,
                s.created_at AS session_created_at,
                u.id, u.organization_id, o.status AS organization_status, u.username_normalized, u.display_name,
                u.status, u.version, u.authz_version, u.session_epoch,
                u.created_at, u.updated_at
           FROM iam.session AS s
           JOIN iam.user_account AS u
             ON u.organization_id = s.organization_id AND u.id = s.user_id
           JOIN org.organization AS o ON o.id = s.organization_id
          WHERE s.token_hash = $1
            AND s.revoked_at IS NULL
          ORDER BY s.id
          LIMIT 1
          FOR UPDATE OF s, u, o`,
        [decodedHash],
      );
      const row = result.rows[0];
      if (row === undefined) return undefined;
      const primary = await client.query<{ business_group_id: string }>(
        `SELECT business_group_id
           FROM org.membership
          WHERE organization_id = $1 AND user_id = $2
            AND status = 'ACTIVE' AND valid_to IS NULL
          ORDER BY is_primary DESC, id
          LIMIT 1`,
        [row.organization_id, row.id],
      );
      row.primary_business_group_id = primary.rows[0]?.business_group_id ?? null;
      const user = await this.loadUser(client, row);
      return {
        session: {
          id: row.session_id,
          tokenHash: row.token_hash.toString('hex'),
          userId: row.session_user_id,
          organizationId: row.session_organization_id,
          authzVersion: toPositiveInteger(row.session_authz_version),
          sessionEpoch: toPositiveInteger(row.session_epoch_value),
          expiresAt: row.expires_at.toISOString(),
          createdAt: row.session_created_at.toISOString(),
        },
        user,
      };
    });
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.withClient(async (client) => {
      await client.query('UPDATE iam.session SET revoked_at = clock_timestamp() WHERE token_hash = $1 AND revoked_at IS NULL', [decodeHash(tokenHash)]);
    });
  }

  async recordAuthenticationAudit(input: AuthenticationAuditInput): Promise<void> {
    await this.withTransaction(async (client) => {
      await this.appendAuthenticationAudit(client, input);
    });
  }

  private async appendAuthenticationAudit(client: PoolClient, input: AuthenticationAuditInput): Promise<void> {
    const eventId = randomUUID();
    await client.query(
      `INSERT INTO audit.authentication_event
        (id, organization_id, actor_user_id, provider, outcome, reason, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [eventId, input.organizationId ?? null, input.actorUserId ?? null, input.provider, input.outcome, input.reason, input.requestId],
    );
    if (input.organizationId !== undefined) {
      await client.query(
        `INSERT INTO integration.identity_outbox_event
          (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, 'AUTHENTICATION', $3, $4, $5::jsonb)`,
        [randomUUID(), input.organizationId, input.actorUserId ?? eventId, `auth.${input.outcome.toLowerCase()}`, JSON.stringify({ authenticationEventId: eventId, provider: input.provider, outcome: input.outcome, reason: input.reason, requestId: input.requestId })],
      );
    }
  }

  async findUserById(id: string): Promise<IdentityUser | undefined> {
    return this.withClient(async (client) => {
      const result = await client.query<UserRow>(
        `SELECT u.id, u.organization_id, o.status AS organization_status, u.username_normalized, u.display_name, u.status,
                u.version, u.authz_version, u.session_epoch, m.business_group_id AS primary_business_group_id,
                u.created_at, u.updated_at
           FROM iam.user_account AS u
           JOIN org.organization AS o ON o.id = u.organization_id
           LEFT JOIN LATERAL (
             SELECT business_group_id
               FROM org.membership
              WHERE organization_id = u.organization_id AND user_id = u.id
                AND status = 'ACTIVE' AND valid_to IS NULL
              ORDER BY is_primary DESC, id
              LIMIT 1
           ) AS m ON true
          WHERE u.id = $1
          LIMIT 1`,
        [id],
      );
      const row = result.rows[0];
      return row === undefined ? undefined : this.loadUser(client, row);
    });
  }

  async findRolePermissions(role: string): Promise<readonly string[]> {
    return this.withClient(async (client) => {
      const result = await client.query<{ code: string }>(
        `SELECT p.code
           FROM iam.role AS r
           JOIN iam.role_permission AS rp ON rp.role_id = r.id
           JOIN iam.permission AS p ON p.id = rp.permission_id
          WHERE r.code = $1 AND r.is_system
          ORDER BY p.code`,
        [role],
      );
      return result.rows.map((row) => row.code);
    });
  }

  async createUser(input: CreateUserMutation): Promise<IdentityUser> {
    return this.withMutationTransaction(input.client, async (client) => {
      await client.query(
        `INSERT INTO iam.user_account
          (id, organization_id, provider, provider_subject, username_normalized, display_name)
         VALUES ($1, $2, 'LOCAL_PASSWORD', $3, $3, $4)`,
        [input.id, input.organizationId, input.username, input.username],
      );
      const role = await client.query<{ id: string }>('SELECT id FROM iam.role WHERE code = $1 AND is_system', [input.role]);
      const roleId = role.rows[0]?.id;
      if (roleId === undefined) throw new Error('Identity role template was not found.');
      await client.query(
        `INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id, granted_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), input.organizationId, input.id, roleId, input.actorUserId],
      );

      const groupIds = [...new Set(input.defaultGroupIds)];
      for (const [index, groupId] of groupIds.entries()) {
        await client.query(
          `INSERT INTO org.membership (id, organization_id, user_id, business_group_id, is_primary)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), input.organizationId, input.id, groupId, index === 0],
        );
      }
      await this.insertDefaultScopes(client, input);
      await this.appendAudit(client, input.audit);
      return this.loadUserById(client, input.organizationId, input.id);
    });
  }

  async replaceRoleBindings(input: RoleBindingMutation): Promise<IdentityUser> {
    return this.withMutationTransaction(input.client, async (client) => {
      const current = await this.lockUser(client, input.organizationId, input.targetUserId);
      this.assertVersion(current, input.expectedVersion);
      await client.query(
        `UPDATE iam.user_role_binding SET valid_to = clock_timestamp()
          WHERE organization_id = $1 AND user_id = $2 AND valid_to IS NULL`,
        [input.organizationId, input.targetUserId],
      );
      for (const role of input.roles) {
        const roleResult = await client.query<{ id: string }>('SELECT id FROM iam.role WHERE code = $1 AND is_system', [role]);
        const roleId = roleResult.rows[0]?.id;
        if (roleId === undefined) throw new Error('Identity role template was not found.');
        await client.query(
          `INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id, granted_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [randomUUID(), input.organizationId, input.targetUserId, roleId, input.actorUserId],
        );
      }
      await this.bumpAuthorizationSnapshot(client, input.organizationId, input.targetUserId);
      await this.appendAudit(client, input.audit);
      return this.loadUserById(client, input.organizationId, input.targetUserId);
    });
  }

  async replaceDataScopeGrants(input: DataScopeMutation): Promise<IdentityUser> {
    return this.withMutationTransaction(input.client, async (client) => {
      const current = await this.lockUser(client, input.organizationId, input.targetUserId);
      this.assertVersion(current, input.expectedVersion);
      await client.query('DELETE FROM iam.user_data_scope WHERE organization_id = $1 AND user_id = $2', [input.organizationId, input.targetUserId]);
      for (const grant of input.grants) {
        const scopeId = randomUUID();
        await client.query(
          `INSERT INTO iam.user_data_scope (id, organization_id, user_id, resource_type, scope_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [scopeId, input.organizationId, input.targetUserId, grant.resourceType, grant.scopeType],
        );
        for (const groupId of grant.groupIds) {
          await client.query(
            `INSERT INTO iam.data_scope_group (scope_id, organization_id, group_id)
             VALUES ($1, $2, $3)`,
            [scopeId, input.organizationId, groupId],
          );
        }
      }
      await this.bumpAuthorizationSnapshot(client, input.organizationId, input.targetUserId);
      await this.appendAudit(client, input.audit);
      return this.loadUserById(client, input.organizationId, input.targetUserId);
    });
  }

  async disableUser(input: DisableUserMutation): Promise<IdentityUser> {
    return this.withMutationTransaction(input.client, async (client) => {
      const current = await this.lockUser(client, input.organizationId, input.targetUserId);
      this.assertVersion(current, input.expectedVersion);
      const result = await client.query(
        `UPDATE iam.user_account
            SET status = 'DISABLED', version = version + 1,
                authz_version = authz_version + 1, session_epoch = session_epoch + 1,
                updated_at = clock_timestamp()
          WHERE organization_id = $1 AND id = $2 AND status = 'ACTIVE'`,
        [input.organizationId, input.targetUserId],
      );
      if (result.rowCount !== 1) throw new IdentityUserNotFoundError();
      await client.query(
        `UPDATE iam.session SET revoked_at = clock_timestamp()
          WHERE organization_id = $1 AND user_id = $2 AND revoked_at IS NULL`,
        [input.organizationId, input.targetUserId],
      );
      await this.appendAudit(client, input.audit);
      return this.loadUserById(client, input.organizationId, input.targetUserId);
    });
  }

  async enqueueDisableUser(input: DisableUserMutation & DisableCommandClaim): Promise<void> {
    await this.withMutationTransaction(input.client, async (client) => {
      await client.query(
        `INSERT INTO integration.identity_outbox_event
          (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, 'USER', $3, 'identity.command.disable_user', $4::jsonb)`,
        [
          randomUUID(),
          input.organizationId,
          input.targetUserId,
          JSON.stringify({
            commandId: input.commandId,
            operationId: input.operationId,
            ownerToken: input.ownerToken.toString('base64'),
            startedAt: input.startedAt,
            expiresAt: input.expiresAt,
            retryAfterMs: input.retryAfterMs,
            mutation: {
              organizationId: input.organizationId,
              targetUserId: input.targetUserId,
              actorUserId: input.actorUserId,
              expectedVersion: input.expectedVersion,
              audit: input.audit,
            },
          }),
        ],
      );
    });
  }

  async recordAudit(input: AuditEventInput): Promise<void> {
    await this.withTransaction(async (client) => {
      await this.appendAudit(client, input);
    });
  }

  async listAuditEvents(input: { principal: AuthorizationPrincipal; filters: AuditQueryFilters }): Promise<AuditEventPage> {
    return this.withClient(async (client) => {
      const values: unknown[] = [input.principal.organizationId];
      const predicates = ['a.organization_id = $1'];
      const grant = input.principal.scopes.get('AUDIT');
      if (grant?.scopeType === 'OWN') {
        values.push(input.principal.userId);
        predicates.push(`a.actor_user_id = $${values.length}`);
      } else if (grant?.scopeType === 'GROUP_SET') {
        values.push(grant.groupIds);
        predicates.push(`EXISTS (
          SELECT 1 FROM org.membership AS m
           WHERE m.organization_id = a.organization_id
             AND m.user_id = a.actor_user_id
             AND m.business_group_id = ANY($${values.length}::uuid[])
             AND m.status = 'ACTIVE' AND m.valid_to IS NULL
        )`);
      }
      addArrayPredicate(predicates, values, 'a.actor_user_id', input.filters.actorUserId, 'uuid');
      addArrayPredicate(predicates, values, 'a.action', input.filters.action, 'text');
      addArrayPredicate(predicates, values, 'a.resource_type', input.filters.resourceType, 'text');
      const cursor = decodeCursor(input.filters.after);
      if (cursor !== undefined) {
        values.push(cursor.createdAt, cursor.id);
        predicates.push(`(a.created_at, a.id) < ($${values.length - 1}, $${values.length})`);
      }
      const requestedSize = input.filters.size ?? 20;
      const size = Math.min(100, Math.max(1, requestedSize));
      values.push(size + 1);
      const result = await client.query<AuditRow>(
        `SELECT a.id, a.organization_id, a.actor_user_id, a.action, a.resource_type,
                a.resource_id, a.outcome, a.reason, a.before_summary, a.after_summary,
                a.trace_id, a.created_at
           FROM audit.audit_event AS a
          WHERE ${predicates.join(' AND ')}
          ORDER BY a.created_at DESC, a.id DESC
          LIMIT $${values.length}`,
        values,
      );
      const rows = result.rows.slice(0, size);
      const hasNext = result.rows.length > size;
      const last = rows.at(-1);
      return {
        data: rows.map((row) => ({
          id: row.id,
          organizationId: row.organization_id,
          version: 1,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.created_at.toISOString(),
          actorUserId: row.actor_user_id,
          action: row.action,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          details: {
            outcome: row.outcome,
            ...(row.reason === null ? {} : { reason: row.reason }),
            before: row.before_summary,
            after: row.after_summary,
            ...(row.trace_id === null ? {} : { traceId: row.trace_id }),
          },
        })),
        page: {
          hasNext,
          nextCursor: hasNext && last !== undefined ? encodeCursor({ createdAt: last.created_at.toISOString(), id: last.id }) : null,
        },
      };
    });
  }

  private async loadUser(client: PoolClient, row: UserRow): Promise<IdentityUser> {
    const roles = await client.query<{ code: string }>(
      `SELECT r.code
         FROM iam.user_role_binding AS b
         JOIN iam.role AS r ON r.id = b.role_id
        WHERE b.organization_id = $1 AND b.user_id = $2 AND b.valid_to IS NULL
        ORDER BY r.code`,
      [row.organization_id, row.id],
    );
    const permissions = await client.query<{ code: string }>(
      `SELECT DISTINCT p.code
         FROM iam.user_role_binding AS b
         JOIN iam.role_permission AS rp ON rp.role_id = b.role_id
         JOIN iam.permission AS p ON p.id = rp.permission_id
        WHERE b.organization_id = $1 AND b.user_id = $2 AND b.valid_to IS NULL
        ORDER BY p.code`,
      [row.organization_id, row.id],
    );
    const scopes = await client.query<ScopeRow>(
      `SELECT s.resource_type, s.scope_type,
              COALESCE(array_agg(g.group_id ORDER BY g.group_id) FILTER (WHERE g.group_id IS NOT NULL), ARRAY[]::uuid[]) AS group_ids
         FROM iam.user_data_scope AS s
         LEFT JOIN iam.data_scope_group AS g
           ON g.organization_id = s.organization_id AND g.scope_id = s.id
        WHERE s.organization_id = $1 AND s.user_id = $2
        GROUP BY s.id, s.resource_type, s.scope_type
        ORDER BY s.resource_type`,
      [row.organization_id, row.id],
    );
    const scopeValues: DataScopeGrant[] = scopes.rows.map((scope) => ({ resourceType: scope.resource_type, scopeType: scope.scope_type, groupIds: scope.group_ids }));
    return {
      id: row.id,
      organizationId: row.organization_id,
      organizationStatus: row.organization_status,
      username: row.username_normalized,
      displayName: row.display_name,
      status: row.status,
      version: toPositiveInteger(row.version),
      authzVersion: toPositiveInteger(row.authz_version),
      sessionEpoch: toPositiveInteger(row.session_epoch),
      roles: roles.rows.map((role) => role.code),
      permissions: permissions.rows.map((permission) => permission.code),
      scopes: scopeValues,
      ...(row.primary_business_group_id === null || row.primary_business_group_id === undefined ? {} : { primaryBusinessGroupId: row.primary_business_group_id }),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private async loadUserById(client: PoolClient, organizationId: string, userId: string): Promise<IdentityUser> {
    const result = await client.query<UserRow>(
      `SELECT u.id, u.organization_id, o.status AS organization_status, u.username_normalized, u.display_name, u.status,
              u.version, u.authz_version, u.session_epoch, m.business_group_id AS primary_business_group_id,
              u.created_at, u.updated_at
         FROM iam.user_account AS u
         JOIN org.organization AS o ON o.id = u.organization_id
         LEFT JOIN LATERAL (
           SELECT business_group_id
             FROM org.membership
            WHERE organization_id = u.organization_id AND user_id = u.id
              AND status = 'ACTIVE' AND valid_to IS NULL
            ORDER BY is_primary DESC, id
            LIMIT 1
         ) AS m ON true
        WHERE u.organization_id = $1 AND u.id = $2
        LIMIT 1`,
      [organizationId, userId],
    );
    const row = result.rows[0];
    if (row === undefined) throw new IdentityUserNotFoundError();
    return this.loadUser(client, row);
  }

  private async lockUser(client: PoolClient, organizationId: string, userId: string): Promise<{ version: number }> {
    const result = await client.query<{ version: number | string }>(
      'SELECT version FROM iam.user_account WHERE organization_id = $1 AND id = $2 FOR UPDATE',
      [organizationId, userId],
    );
    const row = result.rows[0];
    if (row === undefined) throw new IdentityUserNotFoundError();
    return { version: toPositiveInteger(row.version) };
  }

  private assertVersion(current: { version: number }, expected: number): void {
    if (current.version !== expected) throw new IdentityVersionConflictError(current.version);
  }

  private async bumpAuthorizationSnapshot(client: PoolClient, organizationId: string, userId: string): Promise<void> {
    const result = await client.query(
      `UPDATE iam.user_account
          SET version = version + 1, authz_version = authz_version + 1,
              session_epoch = session_epoch + 1, updated_at = clock_timestamp()
        WHERE organization_id = $1 AND id = $2`,
      [organizationId, userId],
    );
    if (result.rowCount !== 1) throw new IdentityUserNotFoundError();
  }

  private async insertDefaultScopes(client: PoolClient, input: CreateUserMutation): Promise<void> {
    // A role never implies a data grant. Scope grants are an explicit command
    // and are checked against the actor's resource-specific containment first.
    void client;
    void input;
  }

  private async appendAudit(client: PoolClient, input: AuditEventInput): Promise<void> {
    const auditId = randomUUID();
    await client.query(
      `INSERT INTO audit.audit_event
        (id, organization_id, actor_user_id, action, resource_type, resource_id,
         outcome, reason, before_summary, after_summary, request_id, trace_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12)`,
      [
        auditId,
        input.organizationId,
        input.actorUserId,
        input.action,
        input.resourceType,
        input.resourceId,
        input.outcome,
        input.reason ?? null,
        JSON.stringify(input.beforeSummary ?? {}),
        JSON.stringify(input.afterSummary ?? {}),
        input.requestId,
        input.traceId ?? null,
      ],
    );
    await client.query(
      `INSERT INTO integration.identity_outbox_event
        (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        randomUUID(),
        input.organizationId,
        input.resourceType,
        input.resourceId,
        `identity.${input.outcome.toLowerCase()}`,
        JSON.stringify({ auditId, ...input }),
      ],
    );
  }

  private async withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async withMutationTransaction<T>(transactionClient: PoolClient | undefined, work: (client: PoolClient) => Promise<T>): Promise<T> {
    if (transactionClient !== undefined) return work(transactionClient);
    return this.withTransaction(work);
  }

  private async withClient<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      return await work(client);
    } finally {
      client.release();
    }
  }
}

function decodeHash(value: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('Identity token hash must be a SHA-256 hex digest.');
  return Buffer.from(value, 'hex');
}

function addArrayPredicate(predicates: string[], values: unknown[], column: string, items: readonly string[] | undefined, type: 'uuid' | 'text'): void {
  if (items === undefined || items.length === 0) return;
  values.push(items);
  predicates.push(`${column} = ANY($${values.length}::${type}[])`);
}

function encodeCursor(cursor: { createdAt: string; id: string }): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(value: string | undefined): { createdAt: string; id: string } | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || !('createdAt' in parsed) || !('id' in parsed)) throw new Error('invalid');
    const createdAt = (parsed as { createdAt?: unknown }).createdAt;
    const id = (parsed as { id?: unknown }).id;
    if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt)) || typeof id !== 'string' || !isUuid(id)) throw new Error('invalid');
    return { createdAt, id };
  } catch {
    throw new IdentityCursorError();
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toPositiveInteger(value: number | string): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Identity version must be a positive safe integer.');
  return number;
}
