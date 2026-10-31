# 005 expand SQL draft (review-only; do not execute)

The following SQL is a complete draft for review. It is intentionally outside
`packages/database/migrations/` and contains no business backfill values.

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE SCHEMA IF NOT EXISTS migration_v2;

ALTER TABLE catalog.sku
  ADD COLUMN IF NOT EXISTS standardization_mode text NULL;
ALTER TABLE catalog.price_policy
  ADD COLUMN IF NOT EXISTS is_primary boolean NULL,
  ADD COLUMN IF NOT EXISTS risk_buffer_bps integer NULL,
  ADD COLUMN IF NOT EXISTS policy_version bigint NULL;

CREATE TABLE IF NOT EXISTS catalog.price_snapshot_v2 (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id),
  sku_id uuid NOT NULL REFERENCES catalog.sku(id),
  source_kind text NOT NULL CHECK (source_kind IN ('CATALOG_POLICY','MANUAL_QUOTE')),
  source_currency char(3) NOT NULL CHECK (source_currency ~ '^[A-Z]{3}$'),
  source_unit_price numeric(19,4) NOT NULL CHECK (source_unit_price >= 0),
  captured_at timestamptz NOT NULL,
  source_policy_id uuid NULL REFERENCES catalog.price_policy(id),
  source_policy_version bigint NULL,
  fingerprint bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS orders.fx_snapshot_v2 (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id),
  base_currency char(3) NOT NULL CHECK (base_currency ~ '^[A-Z]{3}$'),
  quote_currency char(3) NOT NULL CHECK (quote_currency ~ '^[A-Z]{3}$'),
  raw_market_rate numeric(24,12) NOT NULL CHECK (raw_market_rate > 0),
  risk_buffer_bps integer NOT NULL CHECK (risk_buffer_bps BETWEEN 0 AND 2000),
  effective_rate numeric(24,12) NOT NULL CHECK (effective_rate > 0),
  source text NOT NULL CHECK (length(btrim(source)) BETWEEN 1 AND 128),
  captured_at timestamptz NOT NULL,
  fingerprint bytea NOT NULL UNIQUE,
  UNIQUE (organization_id, id)
);

ALTER TABLE orders.order_item
  ADD COLUMN IF NOT EXISTS line_id uuid NULL,
  ADD COLUMN IF NOT EXISTS item_kind text NULL,
  ADD COLUMN IF NOT EXISTS standardization_mode text NULL,
  ADD COLUMN IF NOT EXISTS order_currency_v2 char(3) NULL,
  ADD COLUMN IF NOT EXISTS source_price_currency char(3) NULL,
  ADD COLUMN IF NOT EXISTS source_unit_price numeric(19,4) NULL,
  ADD COLUMN IF NOT EXISTS effective_unit_price_v2 numeric(19,4) NULL,
  ADD COLUMN IF NOT EXISTS line_amount_v2 numeric(19,4) NULL,
  ADD COLUMN IF NOT EXISTS price_snapshot_v2_id uuid NULL,
  ADD COLUMN IF NOT EXISTS fx_snapshot_v2_id uuid NULL,
  ADD COLUMN IF NOT EXISTS price_source_kind text NULL,
  ADD COLUMN IF NOT EXISTS price_captured_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS image_file_id uuid NULL,
  ADD COLUMN IF NOT EXISTS v2_snapshot_version bigint NULL;

CREATE UNIQUE INDEX IF NOT EXISTS order_item_v2_line_key_uq
  ON orders.order_item (organization_id, order_id, line_id)
  WHERE line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_v2_image_idx
  ON orders.order_item (image_file_id)
  WHERE image_file_id IS NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_price_snapshot_fk') THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_price_snapshot_fk
      FOREIGN KEY (organization_id, price_snapshot_v2_id) REFERENCES catalog.price_snapshot_v2(organization_id, id) NOT VALID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_fx_snapshot_fk') THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_fx_snapshot_fk
      FOREIGN KEY (organization_id, fx_snapshot_v2_id) REFERENCES orders.fx_snapshot_v2(organization_id, id) NOT VALID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_image_file_fk') THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_image_file_fk
      FOREIGN KEY (organization_id, image_file_id) REFERENCES files.file_object(organization_id, id) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS migration_v2.backfill_run (
  run_id uuid PRIMARY KEY,
  input_sha256 bytea NOT NULL UNIQUE,
  approved_by uuid NOT NULL,
  source_ref text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  status text NOT NULL CHECK (status IN ('RUNNING','APPLIED','GAPS','FAILED')),
  total_count bigint NOT NULL DEFAULT 0,
  applied_count bigint NOT NULL DEFAULT 0,
  gap_count bigint NOT NULL DEFAULT 0,
  per_kind_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  per_organization_counts jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS migration_v2.backfill_item (
  run_id uuid NOT NULL REFERENCES migration_v2.backfill_run(run_id),
  organization_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  sku_id uuid NULL,
  approved_mode text NULL CHECK (approved_mode IN ('STRICT','SIMPLE','NONE')),
  replacement_price_snapshot_id uuid NULL REFERENCES catalog.price_snapshot_v2(id),
  replacement_fx_snapshot_id uuid NULL REFERENCES orders.fx_snapshot_v2(id),
  disposition text NOT NULL CHECK (disposition IN ('APPLIED','GAP','REJECTED')),
  reason text NULL,
  approved_by uuid NOT NULL,
  source_ref text NOT NULL,
  applied_at timestamptz NULL,
  PRIMARY KEY (run_id, organization_id, order_item_id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sku_v2_standardization_mode_ck') THEN
    ALTER TABLE catalog.sku ADD CONSTRAINT sku_v2_standardization_mode_ck
      CHECK (standardization_mode IS NULL OR standardization_mode IN ('STRICT','SIMPLE','NONE')) NOT VALID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_policy_v2_risk_buffer_ck') THEN
    ALTER TABLE catalog.price_policy ADD CONSTRAINT price_policy_v2_risk_buffer_ck
      CHECK (risk_buffer_bps IS NULL OR risk_buffer_bps BETWEEN 0 AND 2000) NOT VALID;
  END IF;
END $$;
COMMIT;
```

The FK validations are deliberately separate from expand. A later controlled
operation locks and validates each constraint with the bounded timeout; a
timeout leaves the constraint `NOT VALID` and is retriable.
