-- Review-only rehearsal down path. Run only on an isolated database before
-- any v2 data is present. This file is intentionally not a package migration.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  durable_table_name text;
  durable_column record;
  has_rows boolean;
BEGIN
  FOREACH durable_table_name IN ARRAY ARRAY[
    'migration_v2.backfill_item',
    'migration_v2.backfill_manifest',
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
  FOR durable_column IN
    SELECT * FROM (VALUES
      ('catalog', 'sku', 'standardization_mode'),
      ('catalog', 'price_policy', 'is_primary'),
      ('catalog', 'price_policy', 'risk_buffer_bps'),
      ('orders', 'order_item', 'line_id'),
      ('orders', 'order_item', 'v2_snapshot_version'),
      ('orders', 'order_item', 'standardization_mode'),
      ('orders', 'order_item', 'order_currency_v2'),
      ('orders', 'order_item', 'source_price_currency'),
      ('orders', 'order_item', 'source_unit_price'),
      ('orders', 'order_item', 'effective_unit_price_v2'),
      ('orders', 'order_item', 'line_amount_v2'),
      ('orders', 'order_item', 'price_snapshot_v2_id'),
      ('orders', 'order_item', 'fx_snapshot_v2_id'),
      ('orders', 'order_item', 'price_source_kind'),
      ('orders', 'order_item', 'price_captured_at'),
      ('orders', 'order_item', 'image_file_id')
    ) AS columns(schema_name, table_name, column_name)
  LOOP
    IF to_regclass(format('%I.%I', durable_column.schema_name, durable_column.table_name)) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = durable_column.schema_name
           AND table_name = durable_column.table_name
           AND column_name = durable_column.column_name
       ) THEN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I IS NOT NULL)',
        durable_column.schema_name,
        durable_column.table_name,
        durable_column.column_name
      ) INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'pre-data down refused: durable v2 column fact exists in %.%.%', durable_column.schema_name, durable_column.table_name, durable_column.column_name USING ERRCODE = '55000';
      END IF;
    END IF;
  END LOOP;
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
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.begin_backfill_run(uuid, bytea, uuid, text)';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.guard_backfill_manifest()';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.apply_backfill_item(uuid, uuid, uuid)';
    EXECUTE 'DROP FUNCTION IF EXISTS migration_v2.finish_backfill_run(uuid)';
  END IF;
END $$;

DROP TABLE IF EXISTS migration_v2.backfill_manifest;
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
