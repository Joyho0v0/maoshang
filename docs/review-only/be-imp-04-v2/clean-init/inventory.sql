-- Review-only schema inventory. It is read-only and must target a disposable
-- database that has already passed preflight; it never resets or deletes data.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout = '30s';
DO $$
BEGIN
  IF to_regnamespace('migration_v2') IS NOT NULL
     OR EXISTS (
       SELECT 1
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname ILIKE '%legacy_conversion%'
     ) THEN
    RAISE EXCEPTION 'clean-init inventory failed: cancelled legacy initialization object remains' USING ERRCODE = '55000';
  END IF;
END $$;
SELECT 'CLEAN_INIT_SCHEMA' AS evidence,
       current_database() AS database_name,
       (SELECT oid FROM pg_database WHERE datname = current_database()) AS database_oid,
       current_user AS owner,
       inet_server_port() AS port,
       (pg_control_system()).system_identifier AS cluster_identifier,
       current_setting('server_version') AS server_version,
       pg_is_in_recovery() AS recovery,
       current_setting('default_transaction_read_only') AS read_only;
SELECT n.nspname AS schema_name, c.relname AS object_name, c.relkind AS object_kind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE (n.nspname, c.relname) IN (
   ('catalog', 'price_snapshot_v2'), ('orders', 'fx_snapshot_v2'),
   ('catalog', 'sku'), ('catalog', 'price_policy'), ('orders', 'order_item')
 )
 ORDER BY n.nspname, c.relname;
SELECT table_schema, table_name, column_name, is_nullable, data_type
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
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
 )
 ORDER BY table_schema, table_name, column_name;
SELECT 'CLEAN_INIT_CANCELLED_LEGACY_OBJECTS' AS evidence,
       count(*) FILTER (WHERE n.nspname = 'migration_v2') AS cancelled_schema_count,
       count(*) FILTER (WHERE c.relname ILIKE '%legacy%') AS cancelled_legacy_object_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace;
COMMIT;
