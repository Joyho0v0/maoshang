-- Review-only post-seed smoke. Run only after clean-init/seed.sql in a uniquely
-- named disposable PostgreSQL 16 database after live preflight binding.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
SET LOCAL TIME ZONE 'UTC';

DO $$
DECLARE
  organization_count integer;
  sku_count integer;
  complete_item_count integer;
  legacy_null_count integer;
BEGIN
  IF current_database() !~ '^be_imp_04_cleaninit_[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'clean-init smoke refused: target identity or disposable marker is not approved' USING ERRCODE = '55000';
  END IF;
  SELECT count(*) INTO organization_count FROM org.organization WHERE code = 'SYN-JOYHO33';
  SELECT count(*) INTO sku_count FROM catalog.sku WHERE sku_code = 'SYN-SKU-1' AND standardization_mode IS NOT NULL;
  SELECT count(*) INTO complete_item_count
    FROM orders.order_item
   WHERE v2_snapshot_version IS NOT NULL
     AND line_id IS NOT NULL
     AND standardization_mode IS NOT NULL
     AND order_currency_v2 IS NOT NULL
     AND source_price_currency IS NOT NULL
     AND source_unit_price IS NOT NULL
     AND effective_unit_price_v2 IS NOT NULL
     AND line_amount_v2 IS NOT NULL
     AND price_source_kind IS NOT NULL
     AND price_captured_at IS NOT NULL;
  IF organization_count <> 1 OR sku_count <> 1 OR complete_item_count <> 1 THEN
    RAISE EXCEPTION 'clean-init smoke failed: org %, sku %, complete item %', organization_count, sku_count, complete_item_count;
  END IF;
  SELECT count(*) INTO legacy_null_count FROM catalog.sku WHERE standardization_mode IS NULL;
  IF legacy_null_count <> 0 THEN
    RAISE EXCEPTION 'clean synthetic seed unexpectedly contains legacy-null SKU facts';
  END IF;
  RAISE NOTICE 'clean seed contains no legacy-null facts; upgrade fixture separately proves UNCLASSIFIED fail-closed';
END $$;

SELECT 'CLEAN_INIT_SMOKE' AS evidence,
       (SELECT count(*) FROM org.organization WHERE code = 'SYN-JOYHO33') AS organizations,
       (SELECT count(*) FROM catalog.sku WHERE sku_code = 'SYN-SKU-1') AS skus,
       (SELECT count(*) FROM orders.order_item WHERE v2_snapshot_version IS NOT NULL) AS complete_v2_items;
COMMIT;
