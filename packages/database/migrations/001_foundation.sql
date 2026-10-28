CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS core.organization (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.user_account (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);
CREATE INDEX IF NOT EXISTS user_account_organization_idx ON core.user_account (organization_id, id);

CREATE TABLE IF NOT EXISTS integration.idempotency_record (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  actor_user_id uuid NOT NULL,
  operation_id text NOT NULL,
  key_hash bytea NOT NULL CHECK (octet_length(key_hash) = 32),
  request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
  state text NOT NULL CHECK (state IN ('IN_PROGRESS', 'SUCCEEDED', 'FAILED')),
  owner_token bytea NOT NULL CHECK (octet_length(owner_token) >= 16),
  lease_expires_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  http_status integer CHECK (http_status IS NULL OR (http_status BETWEEN 200 AND 599)),
  response_body jsonb,
  problem_body jsonb,
  resource_type text,
  resource_id uuid,
  resource_version integer,
  resource_href text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL,
  last_internal_error_code text,
  UNIQUE (organization_id, actor_user_id, operation_id, key_hash),
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES core.user_account (organization_id, id),
  CHECK (state = 'IN_PROGRESS' OR completed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idempotency_organization_actor_idx ON integration.idempotency_record (organization_id, actor_user_id, id);
CREATE INDEX IF NOT EXISTS idempotency_actor_idx ON integration.idempotency_record (actor_user_id, id);
CREATE INDEX IF NOT EXISTS idempotency_lease_idx ON integration.idempotency_record (lease_expires_at, id) WHERE state = 'IN_PROGRESS';
CREATE INDEX IF NOT EXISTS idempotency_expiry_idx ON integration.idempotency_record (expires_at, id) WHERE state IN ('SUCCEEDED', 'FAILED');

CREATE TABLE IF NOT EXISTS integration.outbox_event (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
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
  CONSTRAINT outbox_claim_consistency CHECK (
    (status = 'CLAIMED' AND claimed_at IS NOT NULL AND claim_owner_token IS NOT NULL AND claim_expires_at IS NOT NULL)
    OR (status <> 'CLAIMED' AND claimed_at IS NULL AND claim_owner_token IS NULL AND claim_expires_at IS NULL)
  )
);
ALTER TABLE integration.outbox_event ADD COLUMN IF NOT EXISTS claim_owner_token bytea CHECK (claim_owner_token IS NULL OR octet_length(claim_owner_token) >= 16);
ALTER TABLE integration.outbox_event ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outbox_claim_consistency' AND conrelid = 'integration.outbox_event'::regclass) THEN
    ALTER TABLE integration.outbox_event ADD CONSTRAINT outbox_claim_consistency CHECK (
      (status = 'CLAIMED' AND claimed_at IS NOT NULL AND claim_owner_token IS NOT NULL AND claim_expires_at IS NOT NULL)
      OR (status <> 'CLAIMED' AND claimed_at IS NULL AND claim_owner_token IS NULL AND claim_expires_at IS NULL)
    );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS outbox_organization_idx ON integration.outbox_event (organization_id, id);
CREATE INDEX IF NOT EXISTS outbox_status_idx ON integration.outbox_event (status, available_at, id);
CREATE INDEX IF NOT EXISTS outbox_claim_expiry_idx ON integration.outbox_event (claim_expires_at, id) WHERE status = 'CLAIMED';

CREATE TABLE IF NOT EXISTS audit.event (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  actor_user_id uuid REFERENCES core.user_account(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  request_id uuid NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit.event DROP CONSTRAINT IF EXISTS event_actor_user_id_fkey;
ALTER TABLE audit.event DROP CONSTRAINT IF EXISTS event_actor_organization_fkey;
ALTER TABLE audit.event ADD CONSTRAINT event_actor_organization_fkey FOREIGN KEY (organization_id, actor_user_id) REFERENCES core.user_account (organization_id, id);
CREATE INDEX IF NOT EXISTS audit_event_organization_idx ON audit.event (organization_id, created_at, id);
CREATE INDEX IF NOT EXISTS audit_event_organization_actor_idx ON audit.event (organization_id, actor_user_id, id);
CREATE INDEX IF NOT EXISTS audit_event_actor_idx ON audit.event (actor_user_id, created_at, id);
