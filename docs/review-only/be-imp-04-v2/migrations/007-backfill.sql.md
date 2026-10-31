# 007 backfill SQL draft (review-only; do not execute)

```sql
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

CREATE TEMP TABLE v2_mapping_input (
  organization_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  sku_id uuid NULL,
  standardization_mode text NULL,
  source_price_currency char(3) NULL,
  source_unit_price numeric(19,4) NULL,
  fx_raw_market_rate numeric(24,12) NULL,
  fx_risk_buffer_bps integer NULL,
  approved_by uuid NOT NULL,
  source_ref text NOT NULL,
  PRIMARY KEY (organization_id, order_item_id)
) ON COMMIT DROP;

-- The operator loads only the owner-approved CSV. No default mode, current
-- SKU policy, tracking mode or global price may fill a missing value.
-- COPY v2_mapping_input FROM STDIN WITH (FORMAT csv, HEADER true);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_v2.backfill_run
    WHERE run_id = :run_id
      AND input_sha256 <> decode(:input_sha256_hex, 'hex')
  ) THEN
    RAISE EXCEPTION 'run_id already belongs to another input digest';
  END IF;
  IF EXISTS (
    SELECT 1 FROM migration_v2.backfill_run
    WHERE input_sha256 = decode(:input_sha256_hex, 'hex')
      AND status IN ('APPLIED','GAPS')
      AND run_id <> :run_id
  ) THEN
    RAISE EXCEPTION 'completed input digest must be resumed by its original run_id';
  END IF;
END $$;

INSERT INTO migration_v2.backfill_run
  (run_id, input_sha256, approved_by, source_ref, status, total_count)
VALUES
  (:run_id, decode(:input_sha256_hex, 'hex'), :approved_by, :source_ref,
   'RUNNING', (SELECT count(*) FROM v2_mapping_input))
ON CONFLICT (input_sha256) DO UPDATE
  SET status = migration_v2.backfill_run.status
  WHERE migration_v2.backfill_run.status IN ('APPLIED','GAPS');

INSERT INTO migration_v2.backfill_item
  (run_id, organization_id, order_item_id, sku_id, approved_mode,
   disposition, approved_by, source_ref, reason)
SELECT :run_id, i.organization_id, i.order_item_id, i.sku_id,
       i.standardization_mode,
       CASE WHEN oi.id IS NULL THEN 'GAP' ELSE 'APPLIED' END,
       i.approved_by, i.source_ref,
       CASE WHEN oi.id IS NULL THEN 'ORDER_ITEM_NOT_FOUND' END
FROM v2_mapping_input i
LEFT JOIN orders.order_item oi
  ON oi.id = i.order_item_id AND oi.organization_id = i.organization_id
ON CONFLICT (run_id, organization_id, order_item_id) DO NOTHING;

-- Each APPLIED row gets a replacement snapshot identified by a fingerprint
-- of the approved immutable facts. The old snapshot row is retained. The
-- application updates only the referencing v2 pointer for this order_item;
-- it never updates/deletes a historical snapshot row. This statement is
-- intentionally schematic about UUID binding (:new_price_snapshot_id): the
-- implementation must use one deterministic INSERT ... ON CONFLICT result per
-- mapping row, then repoint exactly that order_item under its row lock.

UPDATE migration_v2.backfill_run r
SET finished_at = now(),
    status = CASE WHEN EXISTS (
      SELECT 1 FROM migration_v2.backfill_item b
      WHERE b.run_id = r.run_id AND b.disposition = 'GAP'
    ) THEN 'GAPS' ELSE 'APPLIED' END,
    applied_count = (SELECT count(*) FROM migration_v2.backfill_item b WHERE b.run_id = r.run_id AND b.disposition = 'APPLIED'),
    gap_count = (SELECT count(*) FROM migration_v2.backfill_item b WHERE b.run_id = r.run_id AND b.disposition = 'GAP')
WHERE r.run_id = :run_id;
COMMIT;
```

The final implementation must replace the named parameters with prepared
statement parameters, bind a deterministic run UUID, and make replacement
snapshot insertion/repointing idempotent. A second execution of the same run
must report the existing applied rows and leave order version/audit/outbox
counts unchanged. A new digest for a completed run is rejected. Mapping a
shared old snapshot is still per `organization_id + order_item_id`, so two
items may receive different replacement snapshots.
