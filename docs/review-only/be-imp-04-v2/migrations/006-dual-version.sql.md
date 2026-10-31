# 006 dual-version SQL draft (review-only; do not execute)

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

CREATE OR REPLACE FUNCTION migration_v2.assert_price_policy_window()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  overlap_count integer;
BEGIN
  IF NEW.valid_to IS NOT NULL AND NEW.valid_to <= NEW.valid_from THEN
    RAISE EXCEPTION 'price policy interval must be half-open and increasing' USING ERRCODE = '23514';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(
    NEW.organization_id::text || ':' || NEW.sku_id::text || ':' || NEW.currency, 0));
  SELECT count(*) INTO overlap_count
  FROM catalog.price_policy p
  WHERE p.organization_id = NEW.organization_id
    AND p.sku_id = NEW.sku_id
    AND p.currency = NEW.currency
    AND p.id <> NEW.id
    AND tstzrange(p.valid_from, COALESCE(p.valid_to, 'infinity'::timestamptz), '[)')
        && tstzrange(NEW.valid_from, COALESCE(NEW.valid_to, 'infinity'::timestamptz), '[)')
    AND (p.is_primary IS TRUE OR NEW.is_primary IS TRUE);
  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'overlapping active/primary price policy' USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS price_policy_v2_window_guard ON catalog.price_policy;
CREATE TRIGGER price_policy_v2_window_guard
  BEFORE INSERT OR UPDATE ON catalog.price_policy
  FOR EACH ROW EXECUTE FUNCTION migration_v2.assert_price_policy_window();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_kind_shape_ck') THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_kind_shape_ck CHECK (
      v2_snapshot_version IS NULL OR (
        line_id IS NOT NULL AND (
        item_kind = 'STANDARD' AND sku_id IS NOT NULL AND standardization_mode IN ('STRICT','SIMPLE','NONE')
        OR item_kind = 'NON_STANDARD' AND sku_id IS NULL AND standardization_mode IN ('SIMPLE','NONE')
        )
      )
    ) NOT VALID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_price_shape_ck') THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_price_shape_ck CHECK (
      v2_snapshot_version IS NULL OR (
        price_snapshot_v2_id IS NOT NULL AND source_price_currency IS NOT NULL
        AND order_currency_v2 IS NOT NULL
        AND source_unit_price IS NOT NULL AND effective_unit_price_v2 IS NOT NULL
        AND line_amount_v2 IS NOT NULL AND price_source_kind IN ('CATALOG_POLICY','MANUAL_QUOTE')
        AND price_captured_at IS NOT NULL
      )
    ) NOT VALID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_fx_shape_ck') THEN
    ALTER TABLE orders.order_item ADD CONSTRAINT order_item_v2_fx_shape_ck CHECK (
      v2_snapshot_version IS NULL OR (
        (source_price_currency = order_currency_v2 AND fx_snapshot_v2_id IS NULL)
        OR (source_price_currency <> order_currency_v2 AND fx_snapshot_v2_id IS NOT NULL)
      )
    ) NOT VALID;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_v2_decimal_ck') THEN
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

CREATE OR REPLACE FUNCTION migration_v2.prevent_v2_snapshot_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    RAISE EXCEPTION 'v2 immutable snapshot rows cannot be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS price_snapshot_v2_immutable ON catalog.price_snapshot_v2;
CREATE TRIGGER price_snapshot_v2_immutable
  BEFORE UPDATE OR DELETE ON catalog.price_snapshot_v2
  FOR EACH ROW EXECUTE FUNCTION migration_v2.prevent_v2_snapshot_mutation();
DROP TRIGGER IF EXISTS fx_snapshot_v2_immutable ON orders.fx_snapshot_v2;
CREATE TRIGGER fx_snapshot_v2_immutable
  BEFORE UPDATE OR DELETE ON orders.fx_snapshot_v2
  FOR EACH ROW EXECUTE FUNCTION migration_v2.prevent_v2_snapshot_mutation();

-- Writer contract: v2 source/effective facts above are authoritative. Legacy
-- order_item.unit_price receives only effective order-currency value so v1
-- readers remain valid; v2 never reads it back as source price. No v2 write
-- may omit line_id, snapshots, item_kind or mode.
COMMIT;
```

Before a later validation migration, the service must run the same Decimal
validator as the API: quantity max 12 integer + 6 fractional digits, amount
max 15 integer + 4 fractional digits, rate max 12 integer + 12 fractional
digits, and half-up multiplication/sum overflow is rejected as terminal 400.
The four checks above are final database defenses, not the normal client error
path.
