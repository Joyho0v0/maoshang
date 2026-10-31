-- Review-only rehearsal down path. Run only on an isolated database before
-- any v2 data is present. This file is intentionally not a package migration.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  durable_table_name text;
  has_rows boolean;
BEGIN
  FOREACH durable_table_name IN ARRAY ARRAY[
    'migration_v2.backfill_item',
    'migration_v2.backfill_count',
    'migration_v2.approved_legacy_sku_mapping',
    'migration_v2.approved_price_policy_mapping',
    'migration_v2.approved_order_item_mapping',
    'migration_v2.approved_price_fx_mapping',
    'catalog.price_snapshot_v2',
    'orders.fx_snapshot_v2',
    'migration_v2.backfill_run'
  ] LOOP
    IF to_regclass(durable_table_name) IS NOT NULL THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s)', durable_table_name) INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'pre-data down refused: durable v2 evidence exists in %', durable_table_name USING ERRCODE = '55000';
      END IF;
    END IF;
  END LOOP;
  IF to_regclass('catalog.sku') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'catalog' AND table_name = 'sku' AND column_name = 'standardization_mode'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM catalog.sku WHERE standardization_mode IS NOT NULL)' INTO has_rows;
    IF has_rows THEN
      RAISE EXCEPTION 'pre-data down refused: SKU standardization evidence exists' USING ERRCODE = '55000';
    END IF;
  END IF;
  IF to_regclass('catalog.price_policy') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'catalog' AND table_name = 'price_policy' AND column_name = 'risk_buffer_bps'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM catalog.price_policy WHERE risk_buffer_bps IS NOT NULL OR is_primary IS TRUE)' INTO has_rows;
    IF has_rows THEN
      RAISE EXCEPTION 'pre-data down refused: price-policy v2 evidence exists' USING ERRCODE = '55000';
    END IF;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'orders' AND table_name = 'order_item' AND column_name = 'v2_snapshot_version'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM orders.order_item
      WHERE v2_snapshot_version IS NOT NULL
         OR line_id IS NOT NULL
         OR standardization_mode IS NOT NULL
         OR price_snapshot_v2_id IS NOT NULL
         OR fx_snapshot_v2_id IS NOT NULL
         OR image_file_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'pre-data down refused: v2 order-item data exists' USING ERRCODE = '55000';
    END IF;
  END IF;
END $$;

DROP TRIGGER IF EXISTS price_policy_v2_lifecycle_guard ON catalog.price_policy;
DO $$
BEGIN
  IF to_regclass('catalog.price_snapshot_v2') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS price_snapshot_v2_immutable ON catalog.price_snapshot_v2';
  END IF;
  IF to_regclass('orders.fx_snapshot_v2') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS fx_snapshot_v2_immutable ON orders.fx_snapshot_v2';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regnamespace('migration_v2') IS NOT NULL THEN
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.assert_price_policy_lifecycle()';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.prevent_snapshot_mutation()';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.begin_backfill_run(uuid, bytea, uuid, text, bigint)';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.apply_backfill_item(uuid, uuid, uuid)';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.finish_backfill_run(uuid)';
  END IF;
END $$;

ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_image_file_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_fx_snapshot_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_price_snapshot_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_decimal_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_fx_shape_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_price_shape_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_kind_shape_ck;
DROP INDEX IF EXISTS orders.order_item_v2_image_idx;
DROP INDEX IF EXISTS orders.order_item_v2_fx_snapshot_idx;
DROP INDEX IF EXISTS orders.order_item_v2_price_snapshot_idx;
DROP INDEX IF EXISTS orders.order_item_v2_line_uq;
DROP INDEX IF EXISTS orders.order_item_v2_line_idx;
ALTER TABLE orders.order_item
  DROP COLUMN IF EXISTS image_file_id,
  DROP COLUMN IF EXISTS price_captured_at,
  DROP COLUMN IF EXISTS price_source_kind,
  DROP COLUMN IF EXISTS fx_snapshot_v2_id,
  DROP COLUMN IF EXISTS price_snapshot_v2_id,
  DROP COLUMN IF EXISTS line_amount_v2,
  DROP COLUMN IF EXISTS effective_unit_price_v2,
  DROP COLUMN IF EXISTS source_unit_price,
  DROP COLUMN IF EXISTS source_price_currency,
  DROP COLUMN IF EXISTS order_currency_v2,
  DROP COLUMN IF EXISTS standardization_mode,
  DROP COLUMN IF EXISTS v2_snapshot_version,
  DROP COLUMN IF EXISTS line_id;

DROP TABLE IF EXISTS migration_v2.backfill_item;
DROP TABLE IF EXISTS migration_v2.backfill_count;
DROP INDEX IF EXISTS migration_v2.approved_price_policy_policy_idx;
DROP TABLE IF EXISTS migration_v2.approved_price_fx_mapping;
DROP TABLE IF EXISTS migration_v2.approved_order_item_mapping;
DROP TABLE IF EXISTS migration_v2.approved_price_policy_mapping;
DROP TABLE IF EXISTS migration_v2.approved_legacy_sku_mapping;
DROP TABLE IF EXISTS migration_v2.backfill_run;
DROP TABLE IF EXISTS orders.fx_snapshot_v2;
DROP TABLE IF EXISTS catalog.price_snapshot_v2;

ALTER TABLE catalog.price_policy DROP CONSTRAINT IF EXISTS price_policy_v2_window_excl;
DROP INDEX IF EXISTS catalog.price_policy_v2_primary_open_uq;
ALTER TABLE catalog.price_policy DROP CONSTRAINT IF EXISTS price_policy_v2_risk_buffer_ck;
ALTER TABLE catalog.price_policy
  DROP COLUMN IF EXISTS risk_buffer_bps,
  DROP COLUMN IF EXISTS is_primary;
ALTER TABLE catalog.sku DROP CONSTRAINT IF EXISTS sku_v2_standardization_mode_ck;
ALTER TABLE catalog.sku DROP COLUMN IF EXISTS standardization_mode;

DROP SCHEMA IF EXISTS migration_v2;
COMMIT;
