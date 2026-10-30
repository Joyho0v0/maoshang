CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS org;

CREATE TABLE IF NOT EXISTS org.organization (
  id uuid PRIMARY KEY,
  code text NOT NULL CHECK (length(code) BETWEEN 1 AND 64),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (id, code)
);
CREATE UNIQUE INDEX IF NOT EXISTS organization_code_ci_idx ON org.organization (lower(code));

CREATE TABLE IF NOT EXISTS org.business_group (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  parent_id uuid,
  code text NOT NULL CHECK (length(code) BETWEEN 1 AND 64),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, code),
  FOREIGN KEY (organization_id, parent_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS business_group_parent_idx ON org.business_group (organization_id, parent_id, id);

CREATE TABLE IF NOT EXISTS iam.user_account (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('LOCAL_PASSWORD', 'OIDC_SSO')),
  provider_subject text NOT NULL CHECK (length(provider_subject) BETWEEN 1 AND 512),
  username_normalized text NOT NULL CHECK (length(username_normalized) BETWEEN 1 AND 320),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 256),
  password_hash bytea,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  authz_version bigint NOT NULL DEFAULT 1 CHECK (authz_version > 0),
  session_epoch bigint NOT NULL DEFAULT 1 CHECK (session_epoch > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, provider, provider_subject)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_account_username_ci_idx ON iam.user_account (organization_id, lower(username_normalized));
CREATE INDEX IF NOT EXISTS user_account_organization_status_idx ON iam.user_account (organization_id, status, id);

CREATE TABLE IF NOT EXISTS org.membership (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  business_group_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  CHECK (valid_to IS NULL OR valid_to > valid_from),
  UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS membership_primary_user_idx ON org.membership (organization_id, user_id) WHERE is_primary AND status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS membership_user_idx ON org.membership (organization_id, user_id, status, id);
CREATE INDEX IF NOT EXISTS membership_group_idx ON org.membership (organization_id, business_group_id, status, user_id);

CREATE TABLE IF NOT EXISTS org.position_history (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  from_group_id uuid,
  to_group_id uuid,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 2048),
  actor_user_id uuid,
  effective_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, from_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, to_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS position_history_user_idx ON org.position_history (organization_id, user_id, effective_at DESC, id);
CREATE INDEX IF NOT EXISTS position_history_actor_idx ON org.position_history (organization_id, actor_user_id, effective_at DESC, id);

CREATE TABLE IF NOT EXISTS iam.session (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  token_hash bytea NOT NULL CHECK (octet_length(token_hash) = 32),
  authz_version bigint NOT NULL CHECK (authz_version > 0),
  session_epoch bigint NOT NULL CHECK (session_epoch > 0),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token_hash),
  FOREIGN KEY (organization_id, user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS session_user_expiry_idx ON iam.session (organization_id, user_id, expires_at, id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS session_expiry_idx ON iam.session (expires_at, id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS iam.role (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES org.organization(id) ON DELETE RESTRICT,
  code text NOT NULL CHECK (code IN ('SUPER_ADMIN', 'GROUP_LEADER', 'SALES') OR length(code) BETWEEN 1 AND 128),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((is_system AND organization_id IS NULL) OR (NOT is_system AND organization_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS role_system_code_idx ON iam.role (code) WHERE is_system;
CREATE UNIQUE INDEX IF NOT EXISTS role_organization_code_idx ON iam.role (organization_id, code) WHERE NOT is_system;

CREATE TABLE IF NOT EXISTS iam.permission (
  id uuid PRIMARY KEY,
  code text NOT NULL CHECK (code ~ '^[a-z][a-z0-9.:-]{1,127}$'),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 256),
  is_system boolean NOT NULL DEFAULT true,
  UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS iam.role_permission (
  role_id uuid NOT NULL REFERENCES iam.role(id) ON DELETE RESTRICT,
  permission_id uuid NOT NULL REFERENCES iam.permission(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS role_permission_permission_idx ON iam.role_permission (permission_id, role_id);

CREATE TABLE IF NOT EXISTS iam.user_role_binding (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES iam.role(id) ON DELETE RESTRICT,
  granted_by uuid,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, granted_by) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  CHECK (valid_to IS NULL OR valid_to > valid_from),
  UNIQUE (organization_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_role_binding_active_idx ON iam.user_role_binding (organization_id, user_id, role_id) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS user_role_binding_user_idx ON iam.user_role_binding (organization_id, user_id, valid_from DESC, id);
CREATE INDEX IF NOT EXISTS user_role_binding_granted_by_idx ON iam.user_role_binding (organization_id, granted_by, created_at DESC, id);

CREATE TABLE IF NOT EXISTS iam.user_data_scope (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('USER', 'ORGANIZATION', 'CUSTOMER', 'ORDER', 'INVENTORY', 'FILE', 'DOCUMENT', 'TASK', 'AUDIT')),
  scope_type text NOT NULL CHECK (scope_type IN ('OWN', 'GROUP_SET', 'ALL_ORG')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, user_id, resource_type),
  CHECK (scope_type <> 'OWN' OR resource_type <> 'ORGANIZATION')
);
CREATE INDEX IF NOT EXISTS user_data_scope_user_idx ON iam.user_data_scope (organization_id, user_id, resource_type, id);

CREATE TABLE IF NOT EXISTS iam.data_scope_group (
  scope_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  group_id uuid NOT NULL,
  PRIMARY KEY (scope_id, group_id),
  FOREIGN KEY (organization_id, scope_id) REFERENCES iam.user_data_scope (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS data_scope_group_group_idx ON iam.data_scope_group (organization_id, group_id, scope_id);

CREATE TABLE IF NOT EXISTS audit.audit_event (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  actor_user_id uuid,
  action text NOT NULL CHECK (length(action) BETWEEN 1 AND 128),
  resource_type text NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 64),
  resource_id uuid,
  outcome text NOT NULL DEFAULT 'SUCCEEDED' CHECK (outcome IN ('SUCCEEDED', 'DENIED', 'FAILED')),
  reason text CHECK (reason IS NULL OR length(reason) <= 2048),
  before_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id uuid NOT NULL,
  trace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS audit_event_organization_time_idx ON audit.audit_event (organization_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS audit_event_actor_time_idx ON audit.audit_event (organization_id, actor_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS audit_event_resource_idx ON audit.audit_event (organization_id, resource_type, resource_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS audit_event_request_idx ON audit.audit_event (organization_id, request_id, id);

CREATE TABLE IF NOT EXISTS integration.identity_outbox_event (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  aggregate_type text NOT NULL CHECK (length(aggregate_type) BETWEEN 1 AND 64),
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 1 AND 128),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLAIMED', 'PUBLISHED', 'FAILED')),
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claim_owner_token bytea CHECK (claim_owner_token IS NULL OR octet_length(claim_owner_token) >= 16),
  claim_expires_at timestamptz,
  published_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identity_outbox_claim_consistency CHECK (
    (status = 'CLAIMED' AND claimed_at IS NOT NULL AND claim_owner_token IS NOT NULL AND claim_expires_at IS NOT NULL)
    OR (status <> 'CLAIMED' AND claimed_at IS NULL AND claim_owner_token IS NULL AND claim_expires_at IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS identity_outbox_pending_idx ON integration.identity_outbox_event (status, available_at, id);
CREATE INDEX IF NOT EXISTS identity_outbox_organization_idx ON integration.identity_outbox_event (organization_id, id);

CREATE OR REPLACE FUNCTION audit.reject_audit_mutation() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit events are append-only';
END;
$$;
DROP TRIGGER IF EXISTS audit_event_immutable ON audit.audit_event;
CREATE TRIGGER audit_event_immutable
  BEFORE UPDATE OR DELETE ON audit.audit_event
  FOR EACH ROW EXECUTE FUNCTION audit.reject_audit_mutation();

INSERT INTO iam.role (id, code, name, is_system) VALUES
  ('00000000-0000-4000-8000-000000001001', 'SUPER_ADMIN', 'Super administrator', true),
  ('00000000-0000-4000-8000-000000001002', 'GROUP_LEADER', 'Business group leader', true),
  ('00000000-0000-4000-8000-000000001003', 'SALES', 'Sales', true)
ON CONFLICT DO NOTHING;

INSERT INTO iam.permission (id, code, description, is_system) VALUES
  ('00000000-0000-4000-8000-000000002001', 'identity.user.read', 'Read organization users', true),
  ('00000000-0000-4000-8000-000000002002', 'identity.user.create', 'Create organization users', true),
  ('00000000-0000-4000-8000-000000002003', 'identity.user.disable', 'Disable organization users', true),
  ('00000000-0000-4000-8000-000000002004', 'identity.role.grant', 'Grant roles and permissions', true),
  ('00000000-0000-4000-8000-000000002005', 'identity.scope.grant', 'Grant data scopes', true),
  ('00000000-0000-4000-8000-000000002006', 'organization.read', 'Read organization groups', true),
  ('00000000-0000-4000-8000-000000002007', 'audit.read', 'Read audit events', true),
  ('00000000-0000-4000-8000-000000002008', 'audit.export', 'Export audit events', true),
  ('00000000-0000-4000-8000-000000002009', 'customer.read', 'Read customers', true),
  ('00000000-0000-4000-8000-000000002010', 'customer.create', 'Create customers', true),
  ('00000000-0000-4000-8000-000000002011', 'customer.update', 'Update customers', true),
  ('00000000-0000-4000-8000-000000002012', 'customer.approve', 'Approve customers', true),
  ('00000000-0000-4000-8000-000000002013', 'customer.reassign', 'Reassign customers', true),
  ('00000000-0000-4000-8000-000000002014', 'catalog.read', 'Read catalog', true),
  ('00000000-0000-4000-8000-000000002015', 'inventory.read', 'Read inventory', true),
  ('00000000-0000-4000-8000-000000002016', 'inventory.adjust', 'Adjust inventory', true),
  ('00000000-0000-4000-8000-000000002017', 'order.read', 'Read orders', true),
  ('00000000-0000-4000-8000-000000002018', 'order.create', 'Create orders', true),
  ('00000000-0000-4000-8000-000000002019', 'order.update', 'Update orders', true),
  ('00000000-0000-4000-8000-000000002020', 'document.read', 'Read documents', true),
  ('00000000-0000-4000-8000-000000002021', 'document.finalize', 'Finalize documents', true),
  ('00000000-0000-4000-8000-000000002022', 'payment.read', 'Read payments', true)
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_id)
SELECT role.id, permission.id
FROM iam.role
CROSS JOIN iam.permission
WHERE role.code = 'SUPER_ADMIN'
  AND role.is_system
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_id)
SELECT role.id, permission.id
FROM iam.role
JOIN iam.permission ON permission.code = ANY (ARRAY[
  'identity.user.read', 'identity.user.create', 'identity.user.disable',
  'organization.read', 'customer.read', 'customer.create', 'customer.update',
  'customer.approve', 'customer.reassign', 'catalog.read', 'inventory.read',
  'order.read', 'order.create', 'order.update', 'document.read', 'payment.read'
])
WHERE role.code = 'GROUP_LEADER'
  AND role.is_system
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_id)
SELECT role.id, permission.id
FROM iam.role
JOIN iam.permission ON permission.code = ANY (ARRAY[
  'identity.user.read', 'organization.read', 'customer.read', 'customer.create',
  'customer.update', 'catalog.read', 'inventory.read', 'order.read',
  'order.create', 'order.update', 'document.read', 'payment.read'
])
WHERE role.code = 'SALES'
  AND role.is_system
ON CONFLICT DO NOTHING;
