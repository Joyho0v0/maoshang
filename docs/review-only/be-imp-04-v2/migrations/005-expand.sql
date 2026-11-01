-- Review-only migration rehearsal. Never copy this file into packages/database.
-- This is expand-only: existing v1 columns remain valid and every v2 column is
-- nullable until a v2 writer supplies a complete immutable snapshot.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE catalog.sku ADD COLUMN IF NOT EXISTS standardization_mode text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sku_v2_standardization_mode_ck' AND conrelid = 'catalog.sku'::regclass) THEN
    ALTER TABLE catalog.sku ADD CONSTRAINT sku_v2_standardization_mode_ck
      CHECK (standardization_mode IS NULL OR standardization_mode IN ('STRICT', 'SIMPLE', 'NONE')) NOT VALID;
  END IF;
END $$;

-- Existing policies are deliberately not assigned guessed values. A v2 writer
-- must reject a visible legacy-null policy as UNCLASSIFIED/STATE_CONFLICT.
ALTER TABLE catalog.price_policy ADD COLUMN IF NOT EXISTS is_primary boolean;
ALTER TABLE catalog.price_policy ADD COLUMN IF NOT EXISTS risk_buffer_bps integer;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_policy_v2_risk_buffer_ck' AND conrelid = 'catalog.price_policy'::regclass) THEN
    ALTER TABLE catalog.price_policy ADD CONSTRAINT price_policy_v2_risk_buffer_ck
      CHECK (risk_buffer_bps IS NULL OR risk_buffer_bps BETWEEN 0 AND 2000) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS catalog.price_snapshot_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  item_kind text NOT NULL CHECK (item_kind IN ('STANDARD', 'NON_STANDARD')),
  sku_id uuid,
  standardization_mode text NOT NULL CHECK (standardization_mode IN ('STRICT', 'SIMPLE', 'NONE')),
  item_name text NOT NULL CHECK (length(item_name) BETWEEN 1 AND 256),
  unit text NOT NULL CHECK (length(unit) BETWEEN 1 AND 32),
  source_kind text NOT NULL CHECK (source_kind IN ('CATALOG_POLICY', 'MANUAL_QUOTE')),
  source_currency char(3) NOT NULL CHECK (source_currency ~ '^[A-Z]{3}$'),
  source_unit_price numeric(19,4) NOT NULL CHECK (source_unit_price >= 0),
  source_policy_id uuid,
  captured_at timestamptz NOT NULL,
  fingerprint text NOT NULL CHECK (length(fingerprint) = 64),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, fingerprint),
  FOREIGN KEY (organization_id, sku_id) REFERENCES catalog.sku (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, source_policy_id) REFERENCES catalog.price_policy (organization_id, id) ON DELETE RESTRICT,
  CHECK (
    (item_kind = 'STANDARD' AND sku_id IS NOT NULL AND standardization_mode IN ('STRICT', 'SIMPLE', 'NONE') AND source_kind = 'CATALOG_POLICY' AND source_policy_id IS NOT NULL)
    OR (item_kind = 'NON_STANDARD' AND sku_id IS NULL AND standardization_mode IN ('SIMPLE', 'NONE') AND source_kind = 'MANUAL_QUOTE' AND source_policy_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS price_snapshot_v2_sku_idx ON catalog.price_snapshot_v2 (organization_id, sku_id, captured_at DESC, id);
CREATE INDEX IF NOT EXISTS price_snapshot_v2_policy_idx ON catalog.price_snapshot_v2 (organization_id, source_policy_id, id);

CREATE TABLE IF NOT EXISTS orders.fx_snapshot_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  base_currency char(3) NOT NULL CHECK (base_currency ~ '^[A-Z]{3}$'),
  quote_currency char(3) NOT NULL CHECK (quote_currency ~ '^[A-Z]{3}$'),
  raw_market_rate numeric(24,12) NOT NULL CHECK (raw_market_rate > 0),
  risk_buffer_bps integer NOT NULL CHECK (risk_buffer_bps BETWEEN 0 AND 2000),
  effective_rate numeric(24,12) NOT NULL CHECK (effective_rate > 0),
  source text NOT NULL CHECK (length(source) BETWEEN 1 AND 128),
  captured_at timestamptz NOT NULL,
  fingerprint text NOT NULL CHECK (length(fingerprint) = 64),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, fingerprint),
  CHECK (base_currency <> quote_currency)
);
CREATE INDEX IF NOT EXISTS fx_snapshot_v2_pair_idx ON orders.fx_snapshot_v2 (organization_id, base_currency, quote_currency, captured_at DESC, id);

-- Nullable expand columns preserve v1 writer compatibility. v2 validation is
-- conditional on v2_snapshot_version and is staged in 006 as NOT VALID.
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS line_id uuid;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS v2_snapshot_version integer;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS standardization_mode text;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS order_currency_v2 char(3);
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS source_price_currency char(3);
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS source_unit_price numeric(19,4);
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS effective_unit_price_v2 numeric(19,4);
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS line_amount_v2 numeric(19,4);
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS price_snapshot_v2_id uuid;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS fx_snapshot_v2_id uuid;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS price_source_kind text;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS price_captured_at timestamptz;
ALTER TABLE orders.order_item ADD COLUMN IF NOT EXISTS image_file_id uuid;

CREATE INDEX IF NOT EXISTS order_item_v2_line_idx ON orders.order_item (organization_id, order_id, line_id);
CREATE UNIQUE INDEX IF NOT EXISTS order_item_v2_line_uq ON orders.order_item (organization_id, order_id, line_id) WHERE line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_v2_price_snapshot_idx ON orders.order_item (organization_id, price_snapshot_v2_id, id) WHERE price_snapshot_v2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_v2_fx_snapshot_idx ON orders.order_item (organization_id, fx_snapshot_v2_id, id) WHERE fx_snapshot_v2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_item_v2_image_idx ON orders.order_item (organization_id, image_file_id, id) WHERE image_file_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_price_snapshot_fk' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_price_snapshot_fk
      FOREIGN KEY (organization_id, price_snapshot_v2_id) REFERENCES catalog.price_snapshot_v2 (organization_id, id) ON DELETE RESTRICT NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_fx_snapshot_fk' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_fx_snapshot_fk
      FOREIGN KEY (organization_id, fx_snapshot_v2_id) REFERENCES orders.fx_snapshot_v2 (organization_id, id) ON DELETE RESTRICT NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_image_file_fk' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_image_file_fk
      FOREIGN KEY (organization_id, image_file_id) REFERENCES files.file_object (organization_id, id) ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;

COMMIT;
