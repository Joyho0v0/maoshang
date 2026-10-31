# 005+ down / forward-fix draft (review-only; do not execute)

## Fresh or pre-data down

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM migration_v2.backfill_item WHERE disposition = 'APPLIED')
     OR EXISTS (SELECT 1 FROM orders.order_item WHERE v2_snapshot_version IS NOT NULL)
  THEN
    RAISE EXCEPTION 'v2 data exists; use forward-fix, not destructive down';
  END IF;
END $$;
DROP TRIGGER IF EXISTS fx_snapshot_v2_immutable ON orders.fx_snapshot_v2;
DROP TRIGGER IF EXISTS price_snapshot_v2_immutable ON catalog.price_snapshot_v2;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_image_file_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_fx_snapshot_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_price_snapshot_fk;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_decimal_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_fx_shape_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_price_shape_ck;
ALTER TABLE orders.order_item DROP CONSTRAINT IF EXISTS order_item_v2_kind_shape_ck;
DROP INDEX IF EXISTS order_item_v2_line_key_uq;
DROP INDEX IF EXISTS order_item_v2_image_idx;
ALTER TABLE orders.order_item
  DROP COLUMN IF EXISTS line_id,
  DROP COLUMN IF EXISTS standardization_mode,
  DROP COLUMN IF EXISTS order_currency_v2,
  DROP COLUMN IF EXISTS source_price_currency,
  DROP COLUMN IF EXISTS source_unit_price,
  DROP COLUMN IF EXISTS effective_unit_price_v2,
  DROP COLUMN IF EXISTS line_amount_v2,
  DROP COLUMN IF EXISTS price_snapshot_v2_id,
  DROP COLUMN IF EXISTS fx_snapshot_v2_id,
  DROP COLUMN IF EXISTS price_source_kind,
  DROP COLUMN IF EXISTS price_captured_at,
  DROP COLUMN IF EXISTS image_file_id,
  DROP COLUMN IF EXISTS v2_snapshot_version;
ALTER TABLE catalog.sku DROP COLUMN IF EXISTS standardization_mode;
ALTER TABLE catalog.price_policy
  DROP COLUMN IF EXISTS is_primary,
  DROP COLUMN IF EXISTS risk_buffer_bps,
  DROP COLUMN IF EXISTS policy_version;
DROP TABLE IF EXISTS migration_v2.backfill_item;
DROP TABLE IF EXISTS migration_v2.backfill_run;
DROP TABLE IF EXISTS orders.fx_snapshot_v2;
DROP TABLE IF EXISTS catalog.price_snapshot_v2;
DROP SCHEMA IF EXISTS migration_v2;
COMMIT;
```

## Post-data forward-fix

Forward-fix never deletes v2 rows. It creates any missing indexes/constraints
with `IF NOT EXISTS`/named guards, repairs a missing durable evidence row from
the source digest only, then validates each `NOT VALID` constraint in a
separate bounded transaction. It refuses to promote rows with an unresolved
gap and records `FAILED` with the exact constraint name on timeout. The
forward-fix is the recovery path for a partially applied 005/006/007 rollout;
production rollback is code rollback plus forward-fix, not destructive down.

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_price_snapshot_fk;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_fx_snapshot_fk;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_image_file_fk;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_kind_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_price_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_fx_shape_ck;
ALTER TABLE orders.order_item VALIDATE CONSTRAINT order_item_v2_decimal_ck;
COMMIT;
```
