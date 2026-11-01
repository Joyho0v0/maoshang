-- Review-only dual-version validation rehearsal. Never copy into packages/database.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

-- Close the install-time race with v1 writers.  SHARE ROW EXCLUSIVE conflicts
-- with INSERT/UPDATE/DELETE while remaining explicit about the bounded lock
-- acquisition budget; the same lock is held until COMMIT below.
LOCK TABLE catalog.price_policy IN SHARE ROW EXCLUSIVE MODE;

-- Installation is fail-closed: v1 rows written before this review-only trigger
-- must not leave an existing cross-currency overlapping-primary ambiguity.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM catalog.price_policy a
    JOIN catalog.price_policy b
      ON b.organization_id = a.organization_id
     AND b.sku_id = a.sku_id
     AND b.id > a.id
     AND b.is_primary IS TRUE
     AND tstzrange(b.valid_from, COALESCE(b.valid_to, 'infinity'::timestamptz), '[)')
       && tstzrange(a.valid_from, COALESCE(a.valid_to, 'infinity'::timestamptz), '[)')
    WHERE a.is_primary IS TRUE
      AND a.currency <> b.currency
  ) THEN
    RAISE EXCEPTION 'existing cross-currency overlapping primary price policy requires owner forward-fix' USING ERRCODE = '55000';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_policy_v2_window_excl' AND conrelid = 'catalog.price_policy'::regclass) THEN
    ALTER TABLE catalog.price_policy ADD CONSTRAINT price_policy_v2_window_excl
      EXCLUDE USING gist (
        organization_id WITH =,
        sku_id WITH =,
        currency WITH =,
        tstzrange(valid_from, COALESCE(valid_to, 'infinity'::timestamptz), '[)') WITH &&
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS price_policy_v2_primary_open_uq
  ON catalog.price_policy (organization_id, sku_id)
  WHERE is_primary IS TRUE AND valid_to IS NULL;

-- Canonical policy lifecycle: [valid_from, valid_to) is half-open. The SKU
-- lock serializes same-SKU writers before the overlap test; the test spans
-- currencies so a primary policy cannot be ambiguous even when currencies
-- differ. This remains review-only and is not a formal migration.
CREATE OR REPLACE FUNCTION catalog.enforce_v2_price_policy_window()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.valid_to IS NOT NULL AND NEW.valid_to <= NEW.valid_from THEN
    RAISE EXCEPTION 'price policy validity window must be half-open and non-empty' USING ERRCODE = '23514';
  END IF;
  IF NEW.is_primary IS TRUE THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id::text || ':' || NEW.sku_id::text, 0));
    IF EXISTS (
      SELECT 1
      FROM catalog.price_policy p
      WHERE p.organization_id = NEW.organization_id
        AND p.sku_id = NEW.sku_id
        AND p.is_primary IS TRUE
        AND p.id <> NEW.id
        AND tstzrange(p.valid_from, COALESCE(p.valid_to, 'infinity'::timestamptz), '[)')
          && tstzrange(NEW.valid_from, COALESCE(NEW.valid_to, 'infinity'::timestamptz), '[)')
    ) THEN
      RAISE EXCEPTION 'only one overlapping primary price policy is allowed per organization and SKU' USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS price_policy_v2_window_guard ON catalog.price_policy;
CREATE TRIGGER price_policy_v2_window_guard
  BEFORE INSERT OR UPDATE ON catalog.price_policy
  FOR EACH ROW EXECUTE FUNCTION catalog.enforce_v2_price_policy_window();

-- Re-check after the trigger/constraint installation while the table lock is
-- still held.  This is intentionally duplicated instead of relying on the
-- pre-install scan: it documents and proves the final invariant at the same
-- serialization point as the new writer guard.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM catalog.price_policy a
    JOIN catalog.price_policy b
      ON b.organization_id = a.organization_id
     AND b.sku_id = a.sku_id
     AND b.id > a.id
     AND b.is_primary IS TRUE
     AND tstzrange(b.valid_from, COALESCE(b.valid_to, 'infinity'::timestamptz), '[)')
       && tstzrange(a.valid_from, COALESCE(a.valid_to, 'infinity'::timestamptz), '[)')
    WHERE a.is_primary IS TRUE
      AND a.currency <> b.currency
  ) THEN
    RAISE EXCEPTION 'post-install cross-currency overlapping primary price policy requires owner forward-fix' USING ERRCODE = '55000';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION catalog.enforce_v2_price_policy_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.currency, NEW.unit_price, NEW.valid_from, NEW.valid_to, NEW.is_primary, NEW.risk_buffer_bps)
     IS DISTINCT FROM
     (OLD.currency, OLD.unit_price, OLD.valid_from, OLD.valid_to, OLD.is_primary, OLD.risk_buffer_bps)
     AND NEW.version <> OLD.version + 1 THEN
    RAISE EXCEPTION 'price policy facts require an atomic canonical version bump' USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS price_policy_v2_version_guard ON catalog.price_policy;
CREATE TRIGGER price_policy_v2_version_guard
  BEFORE UPDATE ON catalog.price_policy
  FOR EACH ROW EXECUTE FUNCTION catalog.enforce_v2_price_policy_version();

CREATE OR REPLACE FUNCTION catalog.prevent_v2_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'v2 snapshot rows are append-only' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS price_snapshot_v2_immutable ON catalog.price_snapshot_v2;
CREATE TRIGGER price_snapshot_v2_immutable
  BEFORE UPDATE OR DELETE ON catalog.price_snapshot_v2
  FOR EACH ROW EXECUTE FUNCTION catalog.prevent_v2_snapshot_mutation();
DROP TRIGGER IF EXISTS fx_snapshot_v2_immutable ON orders.fx_snapshot_v2;
CREATE TRIGGER fx_snapshot_v2_immutable
  BEFORE UPDATE OR DELETE ON orders.fx_snapshot_v2
  FOR EACH ROW EXECUTE FUNCTION catalog.prevent_v2_snapshot_mutation();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'price_snapshot_v2_shape_ck' AND conrelid = 'catalog.price_snapshot_v2'::regclass) THEN
    ALTER TABLE catalog.price_snapshot_v2 ADD CONSTRAINT price_snapshot_v2_shape_ck CHECK (
      (item_kind = 'STANDARD' AND sku_id IS NOT NULL AND standardization_mode IN ('STRICT', 'SIMPLE', 'NONE') AND source_kind = 'CATALOG_POLICY' AND source_policy_id IS NOT NULL)
      OR (item_kind = 'NON_STANDARD' AND sku_id IS NULL AND standardization_mode IN ('SIMPLE', 'NONE') AND source_kind = 'MANUAL_QUOTE' AND source_policy_id IS NULL)
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_kind_shape_ck' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_kind_shape_ck CHECK (
      v2_snapshot_version IS NULL OR (
        line_id IS NOT NULL AND standardization_mode IS NOT NULL
        AND ((item_kind = 'STANDARD' AND sku_id IS NOT NULL AND standardization_mode IN ('STRICT', 'SIMPLE', 'NONE'))
          OR (item_kind = 'NON_STANDARD' AND sku_id IS NULL AND standardization_mode IN ('SIMPLE', 'NONE')))
      )
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_price_shape_ck' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_price_shape_ck CHECK (
      v2_snapshot_version IS NULL OR (
        price_snapshot_v2_id IS NOT NULL AND order_currency_v2 IS NOT NULL AND source_price_currency IS NOT NULL
        AND source_unit_price IS NOT NULL AND effective_unit_price_v2 IS NOT NULL AND line_amount_v2 IS NOT NULL
        AND price_source_kind IN ('CATALOG_POLICY', 'MANUAL_QUOTE') AND price_captured_at IS NOT NULL
      )
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_fx_shape_ck' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_fx_shape_ck CHECK (
      v2_snapshot_version IS NULL OR (
        (source_price_currency = order_currency_v2 AND fx_snapshot_v2_id IS NULL)
        OR (source_price_currency <> order_currency_v2 AND fx_snapshot_v2_id IS NOT NULL)
      )
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_decimal_ck' AND conrelid = 'orders.order_item'::regclass) THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_decimal_ck CHECK (
      v2_snapshot_version IS NULL OR (
        quantity > 0 AND quantity <= 999999999999.999999
        AND source_unit_price >= 0 AND source_unit_price <= 999999999999999.9999
        AND effective_unit_price_v2 >= 0 AND effective_unit_price_v2 <= 999999999999999.9999
        AND line_amount_v2 >= 0 AND line_amount_v2 <= 999999999999999.9999
      )
    ) NOT VALID;
  END IF;
END $$;

COMMIT;
