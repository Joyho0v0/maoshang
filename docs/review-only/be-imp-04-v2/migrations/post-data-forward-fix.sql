-- Review-only post-data forward-fix. Run only on a disposable isolated
-- PostgreSQL 16 database. It validates existing v2 facts and never resets,
-- deletes, rewrites or invents business data.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('catalog.price_snapshot_v2') IS NULL
     OR to_regclass('orders.fx_snapshot_v2') IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'orders' AND table_name = 'order_item' AND column_name = 'v2_snapshot_version'
     ) THEN
    RAISE EXCEPTION 'post-data forward-fix refused: simplified v2 expand is not installed' USING ERRCODE = '55000';
  END IF;
END $$;

-- Existing v1 policy rows are checked before any VALIDATE succeeds. This is
-- intentionally independent from the trigger installed by 006 so pre-trigger
-- ambiguity cannot pass forward-fix silently.
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
    RAISE EXCEPTION 'post-data forward-fix refused: existing cross-currency overlapping primary price policy' USING ERRCODE = '55000';
  END IF;
END $$;

-- Validation is the only post-data action. Invalid legacy-null v2 facts abort
-- this transaction and remain available for an explicit owner-led fix.
ALTER TABLE catalog.sku VALIDATE CONSTRAINT sku_v2_standardization_mode_ck;
ALTER TABLE catalog.price_policy VALIDATE CONSTRAINT price_policy_v2_risk_buffer_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_price_snapshot_fk;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_fx_snapshot_fk;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_image_file_fk;
ALTER TABLE catalog.price_snapshot_v2 VALIDATE CONSTRAINT price_snapshot_v2_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_kind_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_price_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_fx_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_decimal_ck;

COMMIT;
