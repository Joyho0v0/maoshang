-- BE-IMP-04 is an expand-only migration. The foundation, Identity and Files
-- migrations remain the owners of their objects and are never rewritten here.
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE IF NOT EXISTS crm.customer (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  owner_user_id uuid NOT NULL,
  business_group_id uuid,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'INACTIVE')),
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(contacts) = 'array'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, owner_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS customer_organization_name_ci_uq ON crm.customer (organization_id, lower(name));
CREATE INDEX IF NOT EXISTS customer_organization_owner_idx ON crm.customer (organization_id, owner_user_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_organization_group_idx ON crm.customer (organization_id, business_group_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_organization_status_idx ON crm.customer (organization_id, status, updated_at DESC, id);

CREATE TABLE IF NOT EXISTS crm.customer_contact (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  country_code text CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  timezone text CHECK (timezone IS NULL OR length(timezone) BETWEEN 1 AND 128),
  email text CHECK (email IS NULL OR length(email) BETWEEN 3 AND 320),
  phone text CHECK (phone IS NULL OR length(phone) BETWEEN 1 AND 64),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, customer_id) REFERENCES crm.customer (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS customer_contact_customer_idx ON crm.customer_contact (organization_id, customer_id, created_at, id);
CREATE UNIQUE INDEX IF NOT EXISTS customer_contact_primary_uq ON crm.customer_contact (organization_id, customer_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS crm.customer_approval_attempt (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  submitter_user_id uuid NOT NULL,
  outcome text NOT NULL DEFAULT 'PENDING' CHECK (outcome IN ('PENDING', 'APPROVED', 'REJECTED')),
  reason text CHECK (reason IS NULL OR length(reason) BETWEEN 1 AND 2048),
  decided_by uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, customer_id, attempt_no),
  FOREIGN KEY (organization_id, customer_id) REFERENCES crm.customer (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, submitter_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, decided_by) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  CHECK ((outcome = 'PENDING' AND decided_at IS NULL AND reason IS NULL) OR (outcome <> 'PENDING' AND decided_at IS NOT NULL)),
  CHECK (decided_by IS NULL OR decided_by <> submitter_user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS customer_approval_pending_uq ON crm.customer_approval_attempt (organization_id, customer_id) WHERE outcome = 'PENDING';
CREATE INDEX IF NOT EXISTS customer_approval_customer_idx ON crm.customer_approval_attempt (organization_id, customer_id, attempt_no DESC, id);
CREATE INDEX IF NOT EXISTS customer_approval_submitter_idx ON crm.customer_approval_attempt (organization_id, submitter_user_id, submitted_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_approval_decider_idx ON crm.customer_approval_attempt (organization_id, decided_by, decided_at DESC, id) WHERE decided_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS customer_approval_decider_fk_idx ON crm.customer_approval_attempt (organization_id, decided_by, id);

CREATE TABLE IF NOT EXISTS crm.customer_assignment_history (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  from_owner_user_id uuid,
  from_business_group_id uuid,
  to_owner_user_id uuid NOT NULL,
  to_business_group_id uuid,
  actor_user_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 2048),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, customer_id) REFERENCES crm.customer (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, from_owner_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, from_business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, to_owner_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, to_business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS customer_assignment_customer_idx ON crm.customer_assignment_history (organization_id, customer_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_assignment_actor_idx ON crm.customer_assignment_history (organization_id, actor_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_assignment_to_owner_idx ON crm.customer_assignment_history (organization_id, to_owner_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_assignment_to_group_idx ON crm.customer_assignment_history (organization_id, to_business_group_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_assignment_from_owner_idx ON crm.customer_assignment_history (organization_id, from_owner_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS customer_assignment_from_group_idx ON crm.customer_assignment_history (organization_id, from_business_group_id, created_at DESC, id);

CREATE TABLE IF NOT EXISTS catalog.product (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  product_code text NOT NULL CHECK (length(product_code) BETWEEN 1 AND 64),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  unit text NOT NULL CHECK (length(unit) BETWEEN 1 AND 32),
  description text CHECK (description IS NULL OR length(description) <= 2048),
  category_id uuid,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, product_code)
);
CREATE INDEX IF NOT EXISTS product_organization_status_idx ON catalog.product (organization_id, status, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS product_organization_code_idx ON catalog.product (organization_id, product_code, id);

CREATE TABLE IF NOT EXISTS catalog.sku (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL,
  sku_code text NOT NULL CHECK (length(sku_code) BETWEEN 1 AND 64),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 256),
  unit text NOT NULL CHECK (length(unit) BETWEEN 1 AND 32),
  base_unit text NOT NULL CHECK (length(base_unit) BETWEEN 1 AND 32),
  tracking_mode text NOT NULL DEFAULT 'NONE' CHECK (tracking_mode IN ('NONE', 'LOT', 'SERIAL')),
  low_stock_threshold numeric(18,6) NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  price numeric(19,4) CHECK (price IS NULL OR price >= 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, sku_code),
  FOREIGN KEY (organization_id, product_id) REFERENCES catalog.product (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS sku_organization_product_idx ON catalog.sku (organization_id, product_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS sku_organization_status_idx ON catalog.sku (organization_id, status, updated_at DESC, id);

CREATE TABLE IF NOT EXISTS catalog.price_policy (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  sku_id uuid NOT NULL,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  unit_price numeric(19,4) NOT NULL CHECK (unit_price >= 0),
  internal_cost numeric(19,4) CHECK (internal_cost IS NULL OR internal_cost >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, sku_id) REFERENCES catalog.sku (organization_id, id) ON DELETE RESTRICT,
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS price_policy_current_uq ON catalog.price_policy (organization_id, sku_id, currency) WHERE valid_to IS NULL;
CREATE INDEX IF NOT EXISTS price_policy_sku_idx ON catalog.price_policy (organization_id, sku_id, valid_from DESC, id);

CREATE TABLE IF NOT EXISTS catalog.price_snapshot (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  sku_id uuid,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  unit_price numeric(19,4) NOT NULL CHECK (unit_price >= 0),
  internal_cost numeric(19,4) CHECK (internal_cost IS NULL OR internal_cost >= 0),
  source_policy_id uuid,
  captured_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(snapshot) = 'object'),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, sku_id) REFERENCES catalog.sku (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, source_policy_id) REFERENCES catalog.price_policy (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS price_snapshot_sku_idx ON catalog.price_snapshot (organization_id, sku_id, captured_at DESC, id);
CREATE INDEX IF NOT EXISTS price_snapshot_source_policy_fk_idx ON catalog.price_snapshot (organization_id, source_policy_id, id);

CREATE TABLE IF NOT EXISTS catalog.exchange_rate_snapshot (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  base_currency char(3) NOT NULL CHECK (base_currency ~ '^[A-Z]{3}$'),
  quote_currency char(3) NOT NULL CHECK (quote_currency ~ '^[A-Z]{3}$'),
  rate numeric(24,12) NOT NULL CHECK (rate > 0),
  source text NOT NULL CHECK (length(source) BETWEEN 1 AND 128),
  captured_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(snapshot) = 'object'),
  UNIQUE (organization_id, id),
  CHECK (base_currency <> quote_currency)
);
CREATE INDEX IF NOT EXISTS exchange_rate_pair_idx ON catalog.exchange_rate_snapshot (organization_id, base_currency, quote_currency, captured_at DESC, id);

CREATE TABLE IF NOT EXISTS orders.order_header (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  order_no text NOT NULL CHECK (length(order_no) BETWEEN 1 AND 64),
  owner_user_id uuid NOT NULL,
  business_group_id uuid,
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED')),
  stage text NOT NULL DEFAULT 'INITIAL_CONTACT' CHECK (stage IN ('INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP', 'DEPOSIT_PENDING', 'DEPOSIT_CONFIRMED', 'FULFILLMENT', 'FOB_COMPLETED', 'CLOSED')),
  total_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, order_no),
  FOREIGN KEY (organization_id, customer_id) REFERENCES crm.customer (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, owner_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  CHECK ((stage = 'CLOSED' AND status = 'FULFILLED') OR (stage <> 'CLOSED' AND status <> 'FULFILLED')),
  CHECK ((status = 'CANCELLED' AND stage <> 'CLOSED') OR status <> 'CANCELLED')
);
CREATE INDEX IF NOT EXISTS order_organization_customer_idx ON orders.order_header (organization_id, customer_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS order_organization_owner_idx ON orders.order_header (organization_id, owner_user_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS order_organization_group_idx ON orders.order_header (organization_id, business_group_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS order_organization_status_idx ON orders.order_header (organization_id, status, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS order_organization_stage_idx ON orders.order_header (organization_id, stage, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS order_organization_updated_idx ON orders.order_header (organization_id, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS order_organization_created_idx ON orders.order_header (organization_id, created_at DESC, id);

CREATE TABLE IF NOT EXISTS orders.order_item (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL,
  line_no integer NOT NULL CHECK (line_no > 0),
  item_kind text NOT NULL DEFAULT 'STANDARD' CHECK (item_kind IN ('STANDARD', 'NON_STANDARD')),
  sku_id uuid,
  item_name text NOT NULL CHECK (length(item_name) BETWEEN 1 AND 256),
  unit text NOT NULL CHECK (length(unit) BETWEEN 1 AND 32),
  quantity numeric(18,6) NOT NULL CHECK (quantity > 0),
  unit_price numeric(19,4) NOT NULL CHECK (unit_price >= 0),
  line_amount numeric(19,4) NOT NULL CHECK (line_amount >= 0),
  currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  price_snapshot_id uuid,
  exchange_rate_snapshot_id uuid,
  product_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(product_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, order_id, line_no),
  FOREIGN KEY (organization_id, order_id) REFERENCES orders.order_header (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, sku_id) REFERENCES catalog.sku (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, price_snapshot_id) REFERENCES catalog.price_snapshot (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, exchange_rate_snapshot_id) REFERENCES catalog.exchange_rate_snapshot (organization_id, id) ON DELETE RESTRICT,
  CHECK ((item_kind = 'STANDARD' AND sku_id IS NOT NULL) OR (item_kind = 'NON_STANDARD' AND sku_id IS NULL))
);
CREATE INDEX IF NOT EXISTS order_item_order_idx ON orders.order_item (organization_id, order_id, line_no, id);
CREATE INDEX IF NOT EXISTS order_item_sku_idx ON orders.order_item (organization_id, sku_id, order_id, id) WHERE sku_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_price_snapshot_idx ON orders.order_item (organization_id, price_snapshot_id, order_id, id) WHERE price_snapshot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_fx_snapshot_idx ON orders.order_item (organization_id, exchange_rate_snapshot_id, order_id, id) WHERE exchange_rate_snapshot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_sku_fk_idx ON orders.order_item (organization_id, sku_id, id);
CREATE INDEX IF NOT EXISTS order_item_price_snapshot_fk_idx ON orders.order_item (organization_id, price_snapshot_id, id);
CREATE INDEX IF NOT EXISTS order_item_exchange_rate_snapshot_fk_idx ON orders.order_item (organization_id, exchange_rate_snapshot_id, id);

CREATE TABLE IF NOT EXISTS orders.stage_history (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL,
  from_stage text CHECK (from_stage IS NULL OR from_stage IN ('INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP', 'DEPOSIT_PENDING', 'DEPOSIT_CONFIRMED', 'FULFILLMENT', 'FOB_COMPLETED', 'CLOSED')),
  to_stage text NOT NULL CHECK (to_stage IN ('INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP', 'DEPOSIT_PENDING', 'DEPOSIT_CONFIRMED', 'FULFILLMENT', 'FOB_COMPLETED', 'CLOSED')),
  actor_user_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, order_id) REFERENCES orders.order_header (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS order_stage_history_order_idx ON orders.stage_history (organization_id, order_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_stage_history_actor_idx ON orders.stage_history (organization_id, actor_user_id, created_at DESC, id);

CREATE TABLE IF NOT EXISTS orders.ownership_history (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL,
  from_owner_user_id uuid,
  from_business_group_id uuid,
  to_owner_user_id uuid NOT NULL,
  to_business_group_id uuid,
  actor_user_id uuid NOT NULL,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 2048),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, order_id) REFERENCES orders.order_header (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, from_owner_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, from_business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, to_owner_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, to_business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS order_ownership_history_order_idx ON orders.ownership_history (organization_id, order_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_ownership_history_actor_idx ON orders.ownership_history (organization_id, actor_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_ownership_history_to_owner_idx ON orders.ownership_history (organization_id, to_owner_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_ownership_history_to_group_idx ON orders.ownership_history (organization_id, to_business_group_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_ownership_history_from_owner_idx ON orders.ownership_history (organization_id, from_owner_user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS order_ownership_history_from_group_idx ON orders.ownership_history (organization_id, from_business_group_id, created_at DESC, id);

CREATE OR REPLACE FUNCTION crm.reject_customer_history_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'CRM approval and assignment history are append-only';
END;
$$;
DROP TRIGGER IF EXISTS customer_approval_attempt_immutable ON crm.customer_approval_attempt;
CREATE OR REPLACE FUNCTION crm.guard_customer_approval_attempt_transition() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CRM approval attempts are append-only';
  END IF;
  IF OLD.outcome <> 'PENDING'
     OR NEW.outcome NOT IN ('APPROVED', 'REJECTED')
     OR NEW.id <> OLD.id
     OR NEW.organization_id <> OLD.organization_id
     OR NEW.customer_id <> OLD.customer_id
     OR NEW.attempt_no <> OLD.attempt_no
     OR NEW.submitter_user_id <> OLD.submitter_user_id
     OR NEW.submitted_at <> OLD.submitted_at
     OR NEW.decided_by IS NULL
     OR NEW.decided_at IS NULL THEN
    RAISE EXCEPTION 'CRM approval attempt transition is immutable or invalid';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS customer_approval_attempt_transition ON crm.customer_approval_attempt;
CREATE TRIGGER customer_approval_attempt_transition
  BEFORE UPDATE OR DELETE ON crm.customer_approval_attempt
  FOR EACH ROW EXECUTE FUNCTION crm.guard_customer_approval_attempt_transition();
DROP TRIGGER IF EXISTS customer_assignment_history_immutable ON crm.customer_assignment_history;
CREATE TRIGGER customer_assignment_history_immutable BEFORE UPDATE OR DELETE ON crm.customer_assignment_history FOR EACH ROW EXECUTE FUNCTION crm.reject_customer_history_mutation();

CREATE OR REPLACE FUNCTION catalog.reject_snapshot_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Catalog price and exchange snapshots are immutable';
END;
$$;
DROP TRIGGER IF EXISTS price_snapshot_immutable ON catalog.price_snapshot;
CREATE TRIGGER price_snapshot_immutable BEFORE UPDATE OR DELETE ON catalog.price_snapshot FOR EACH ROW EXECUTE FUNCTION catalog.reject_snapshot_mutation();
DROP TRIGGER IF EXISTS exchange_rate_snapshot_immutable ON catalog.exchange_rate_snapshot;
CREATE TRIGGER exchange_rate_snapshot_immutable BEFORE UPDATE OR DELETE ON catalog.exchange_rate_snapshot FOR EACH ROW EXECUTE FUNCTION catalog.reject_snapshot_mutation();

CREATE OR REPLACE FUNCTION orders.reject_order_history_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Order stage and ownership history are append-only';
END;
$$;
DROP TRIGGER IF EXISTS stage_history_immutable ON orders.stage_history;
CREATE TRIGGER stage_history_immutable BEFORE UPDATE OR DELETE ON orders.stage_history FOR EACH ROW EXECUTE FUNCTION orders.reject_order_history_mutation();
DROP TRIGGER IF EXISTS ownership_history_immutable ON orders.ownership_history;
CREATE TRIGGER ownership_history_immutable BEFORE UPDATE OR DELETE ON orders.ownership_history FOR EACH ROW EXECUTE FUNCTION orders.reject_order_history_mutation();

INSERT INTO iam.permission (id, code, description, is_system) VALUES
  ('00000000-0000-4000-8000-000000002025', 'catalog.write', 'Create and update products and SKUs', true)
ON CONFLICT DO NOTHING;
INSERT INTO iam.role_permission (role_id, permission_id)
SELECT role.id, permission.id
FROM iam.role CROSS JOIN iam.permission
WHERE role.code = 'SUPER_ADMIN' AND role.is_system AND permission.code = 'catalog.write'
ON CONFLICT DO NOTHING;
