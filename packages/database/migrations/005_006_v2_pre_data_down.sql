-- Guarded pre-data down path for formal v2. Run only on a disposable isolated
-- database before v2 business data exists. It never performs reset or truncation.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  durable_column record;
  has_rows boolean;
  table_name text;
BEGIN
  IF to_regnamespace('migration_v2') IS NOT NULL THEN
    RAISE EXCEPTION 'pre-data down refused: cancelled legacy-initialization schema migration_v2 exists' USING ERRCODE = '55000';
  END IF;
  FOREACH table_name IN ARRAY ARRAY['catalog.price_snapshot_v2', 'orders.fx_snapshot_v2'] LOOP
    IF to_regclass(table_name) IS NOT NULL THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s)', table_name) INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'pre-data down refused: v2 snapshot data exists in %', table_name USING ERRCODE = '55000';
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
         SELECT 1 FROM information_schema.columns AS c
         WHERE c.table_schema = durable_column.schema_name
           AND c.table_name = durable_column.table_name
           AND c.column_name = durable_column.column_name
       ) THEN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I IS NOT NULL)',
        durable_column.schema_name, durable_column.table_name, durable_column.column_name
      ) INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'pre-data down refused: v2 column fact exists in %.%.%', durable_column.schema_name, durable_column.table_name, durable_column.column_name USING ERRCODE = '55000';
      END IF;
    END IF;
  END LOOP;
END $$;

DELETE FROM iam.role_permission
WHERE permission_id = '00000000-0000-4000-8000-000000002026';
DELETE FROM iam.permission
WHERE id = '00000000-0000-4000-8000-000000002026'
  AND code = 'order.transition';

DROP TRIGGER IF EXISTS price_policy_v2_lifecycle_guard ON catalog.price_policy;
DROP TRIGGER IF EXISTS price_policy_v2_window_guard ON catalog.price_policy;
DROP TRIGGER IF EXISTS price_policy_v2_version_guard ON catalog.price_policy;
DO $$
BEGIN
  IF to_regclass('catalog.price_snapshot_v2') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS price_snapshot_v2_immutable ON catalog.price_snapshot_v2';
  END IF;
  IF to_regclass('orders.fx_snapshot_v2') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS fx_snapshot_v2_immutable ON orders.fx_snapshot_v2';
  END IF;
END $$;

DROP FUNCTION IF EXISTS catalog.prevent_v2_snapshot_mutation();
DROP FUNCTION IF EXISTS catalog.enforce_v2_price_policy_window();
DROP FUNCTION IF EXISTS catalog.enforce_v2_price_policy_version();
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_image_file_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_fx_snapshot_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_price_snapshot_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_decimal_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_fx_shape_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_price_shape_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_kind_shape_ck;
DO $$
BEGIN
  IF to_regclass('catalog.price_snapshot_v2') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE catalog.price_snapshot_v2 DROP CONSTRAINT IF EXISTS price_snapshot_v2_shape_ck';
  END IF;
END $$;

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

COMMIT;
