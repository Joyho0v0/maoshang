\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

CREATE OR REPLACE FUNCTION migration_v2.begin_backfill_run(
  p_run_id uuid,
  p_input_sha256 bytea,
  p_approved_by uuid,
  p_source_ref text,
  p_total_count bigint
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  existing migration_v2.backfill_run%ROWTYPE;
BEGIN
  IF octet_length(p_input_sha256) <> 32 OR p_total_count < 0 OR length(p_source_ref) NOT BETWEEN 1 AND 512 THEN
    RAISE EXCEPTION 'invalid backfill run metadata' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO existing FROM migration_v2.backfill_run WHERE run_id = p_run_id FOR UPDATE;
  IF FOUND AND existing.input_sha256 <> p_input_sha256 THEN
    RAISE EXCEPTION 'run id is already bound to another input digest' USING ERRCODE = '23P01';
  END IF;
  IF FOUND THEN
    IF existing.approved_by <> p_approved_by OR existing.source_ref <> p_source_ref OR existing.total_count <> p_total_count THEN
      RAISE EXCEPTION 'resume metadata does not match the original approved input' USING ERRCODE = '23P01';
    END IF;
    RETURN existing.status;
  END IF;
  SELECT * INTO existing FROM migration_v2.backfill_run WHERE input_sha256 = p_input_sha256 FOR UPDATE;
  IF FOUND AND existing.run_id <> p_run_id THEN
    RAISE EXCEPTION 'input digest must resume its original run id' USING ERRCODE = '23P01';
  END IF;
  INSERT INTO migration_v2.backfill_run (run_id, input_sha256, approved_by, source_ref, status, total_count)
  VALUES (p_run_id, p_input_sha256, p_approved_by, p_source_ref, 'RUNNING', p_total_count)
  ON CONFLICT (run_id) DO NOTHING;
  RETURN 'RUNNING';
END;
$$;

CREATE OR REPLACE FUNCTION migration_v2.apply_backfill_item(
  p_run_id uuid,
  p_organization_id uuid,
  p_order_item_id uuid
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  run_row migration_v2.backfill_run%ROWTYPE;
  existing_item migration_v2.backfill_item%ROWTYPE;
  item_row orders.order_item%ROWTYPE;
  order_row orders.order_header%ROWTYPE;
  item_map migration_v2.approved_order_item_mapping%ROWTYPE;
  price_map migration_v2.approved_price_fx_mapping%ROWTYPE;
  sku_map migration_v2.approved_legacy_sku_mapping%ROWTYPE;
  policy_map migration_v2.approved_price_policy_mapping%ROWTYPE;
  policy_id uuid;
  new_price_snapshot_id uuid;
  new_fx_snapshot_id uuid;
  captured_at timestamptz := clock_timestamp();
  effective_rate numeric(24,12);
  effective_unit_price numeric(19,4);
  calculated_line_amount numeric(19,4);
  price_fingerprint text;
  fx_fingerprint text;
  gap_reason text;
  item_found boolean := false;
  order_found boolean := false;
  item_map_found boolean := false;
  price_map_found boolean := false;
  sku_current_mode text;
BEGIN
  SELECT * INTO run_row FROM migration_v2.backfill_run WHERE run_id = p_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'backfill run does not exist' USING ERRCODE = '22023'; END IF;
  SELECT * INTO existing_item FROM migration_v2.backfill_item WHERE run_id = p_run_id AND organization_id = p_organization_id AND order_item_id = p_order_item_id;
  IF FOUND AND existing_item.disposition = 'APPLIED' THEN RETURN 'APPLIED'; END IF;
  IF FOUND THEN
    -- A GAP is durable evidence, but it is deliberately retryable after the
    -- owner supplies the missing approved input. finish_backfill_run rebuilds
    -- aggregate counts from the per-item evidence rows.
    DELETE FROM migration_v2.backfill_item
    WHERE run_id = p_run_id AND organization_id = p_organization_id AND order_item_id = p_order_item_id;
  END IF;

  SELECT oi.* INTO item_row
  FROM orders.order_item oi
  WHERE oi.organization_id = p_organization_id AND oi.id = p_order_item_id
  FOR UPDATE;
  item_found := FOUND;
  SELECT * INTO order_row
  FROM orders.order_header oh
  WHERE oh.organization_id = p_organization_id AND oh.id = item_row.order_id
  FOR UPDATE;
  order_found := FOUND;
  SELECT * INTO item_map
  FROM migration_v2.approved_order_item_mapping
  WHERE organization_id = p_organization_id AND order_item_id = p_order_item_id
    AND input_sha256 = run_row.input_sha256 AND approved_by = run_row.approved_by
    AND (source_ref = run_row.source_ref OR source_ref LIKE run_row.source_ref || '/%');
  item_map_found := FOUND;
  SELECT * INTO price_map
  FROM migration_v2.approved_price_fx_mapping
  WHERE organization_id = p_organization_id AND order_item_id = p_order_item_id
    AND input_sha256 = run_row.input_sha256 AND approved_by = run_row.approved_by
    AND (source_ref = run_row.source_ref OR source_ref LIKE run_row.source_ref || '/%');
  price_map_found := FOUND;
  IF item_map_found AND item_map.sku_id IS NOT NULL THEN
    SELECT standardization_mode INTO sku_current_mode
    FROM catalog.sku
    WHERE organization_id = p_organization_id AND id = item_map.sku_id
    FOR UPDATE;
  END IF;

  IF NOT item_found OR NOT order_found OR item_row.id IS NULL THEN
    gap_reason := 'ORDER_ITEM_NOT_FOUND';
  ELSIF NOT item_map_found OR item_map.order_item_id IS NULL THEN
    gap_reason := 'ORDER_ITEM_MAPPING_MISSING';
  ELSIF NOT price_map_found OR price_map.order_item_id IS NULL THEN
    gap_reason := 'PRICE_FX_MAPPING_MISSING';
  ELSIF item_row.item_kind = 'STANDARD' AND item_map.sku_id IS NULL THEN
    gap_reason := 'STANDARD_SKU_MAPPING_MISSING';
  ELSIF item_row.item_kind = 'NON_STANDARD' AND item_map.sku_id IS NOT NULL THEN
    gap_reason := 'NON_STANDARD_SKU_FORBIDDEN';
  ELSIF item_row.item_kind = 'NON_STANDARD' AND item_map.approved_mode NOT IN ('SIMPLE', 'NONE') THEN
    gap_reason := 'NON_STANDARD_MODE_INVALID';
  ELSIF item_row.item_kind = 'STANDARD' AND NOT EXISTS (
    SELECT 1 FROM migration_v2.approved_legacy_sku_mapping
    WHERE organization_id = p_organization_id AND sku_id = item_map.sku_id AND approved_mode = item_map.approved_mode
      AND input_sha256 = run_row.input_sha256 AND approved_by = run_row.approved_by
      AND (source_ref = run_row.source_ref OR source_ref LIKE run_row.source_ref || '/%')
  ) THEN
    gap_reason := 'LEGACY_SKU_MAPPING_MISSING';
  ELSIF item_row.item_kind = 'STANDARD' AND sku_current_mode IS NOT NULL AND sku_current_mode <> item_map.approved_mode THEN
    gap_reason := 'LEGACY_SKU_MODE_CONFLICT';
  END IF;

  IF gap_reason IS NOT NULL THEN
    INSERT INTO migration_v2.backfill_item
      (run_id, organization_id, order_item_id, source_sku_id, approved_mode, source_price_currency, source_unit_price, fx_raw_market_rate, fx_risk_buffer_bps, disposition, reason, approved_by, source_ref)
    VALUES
      (p_run_id, p_organization_id, p_order_item_id, item_map.sku_id, item_map.approved_mode, price_map.source_currency, price_map.source_unit_price, price_map.fx_raw_market_rate, price_map.fx_risk_buffer_bps, 'GAP', gap_reason, COALESCE(item_map.approved_by, run_row.approved_by), COALESCE(item_map.source_ref, run_row.source_ref));
    INSERT INTO migration_v2.backfill_count (run_id, organization_id, item_kind, disposition, row_count)
    VALUES (p_run_id, p_organization_id, COALESCE(item_row.item_kind, 'UNKNOWN'), 'GAP', 1)
    ON CONFLICT (run_id, organization_id, item_kind, disposition) DO UPDATE SET row_count = migration_v2.backfill_count.row_count + 1;
    RETURN 'GAP';
  END IF;

  IF item_row.item_kind = 'STANDARD' THEN
    SELECT * INTO policy_map
    FROM migration_v2.approved_price_policy_mapping
    WHERE organization_id = p_organization_id AND sku_id = item_map.sku_id AND currency = price_map.source_currency
      AND source_unit_price = price_map.source_unit_price
      AND input_sha256 = run_row.input_sha256 AND approved_by = run_row.approved_by
      AND (source_ref = run_row.source_ref OR source_ref LIKE run_row.source_ref || '/%');
    IF NOT FOUND THEN
      gap_reason := 'APPROVED_PRICE_POLICY_MAPPING_MISSING';
    ELSE
      SELECT pp.id INTO policy_id
      FROM catalog.price_policy pp
      WHERE pp.organization_id = p_organization_id AND pp.sku_id = item_map.sku_id AND pp.currency = price_map.source_currency
        AND pp.id = policy_map.policy_id
        AND pp.unit_price = price_map.source_unit_price
        AND pp.version = policy_map.canonical_policy_version
      FOR UPDATE;
      IF policy_id IS NULL THEN gap_reason := 'PRICE_POLICY_FACT_NOT_FOUND'; END IF;
    END IF;
  END IF;
  IF gap_reason IS NULL AND price_map.fx_raw_market_rate IS NOT NULL AND price_map.fx_risk_buffer_bps IS NULL THEN gap_reason := 'FX_RISK_BUFFER_MISSING'; END IF;
  IF gap_reason IS NULL AND item_row.item_kind = 'NON_STANDARD' AND price_map.source_currency <> order_row.currency THEN gap_reason := 'NON_STANDARD_CURRENCY_MISMATCH'; END IF;
  IF gap_reason IS NULL AND price_map.source_currency <> order_row.currency AND price_map.fx_raw_market_rate IS NULL THEN gap_reason := 'FX_MAPPING_MISSING'; END IF;

  IF gap_reason IS NOT NULL THEN
    INSERT INTO migration_v2.backfill_item
      (run_id, organization_id, order_item_id, source_sku_id, approved_mode, source_price_currency, source_unit_price, fx_raw_market_rate, fx_risk_buffer_bps, disposition, reason, approved_by, source_ref)
    VALUES
      (p_run_id, p_organization_id, p_order_item_id, item_map.sku_id, item_map.approved_mode, price_map.source_currency, price_map.source_unit_price, price_map.fx_raw_market_rate, price_map.fx_risk_buffer_bps, 'GAP', gap_reason, item_map.approved_by, item_map.source_ref);
    INSERT INTO migration_v2.backfill_count (run_id, organization_id, item_kind, disposition, row_count)
    VALUES (p_run_id, p_organization_id, item_row.item_kind, 'GAP', 1)
    ON CONFLICT (run_id, organization_id, item_kind, disposition) DO UPDATE SET row_count = migration_v2.backfill_count.row_count + 1;
    RETURN 'GAP';
  END IF;

  IF item_row.item_kind = 'STANDARD' THEN
    UPDATE catalog.sku
    SET standardization_mode = item_map.approved_mode,
        version = CASE WHEN standardization_mode IS NULL THEN version + 1 ELSE version END,
        updated_at = captured_at
    WHERE organization_id = p_organization_id AND id = item_map.sku_id
      AND (standardization_mode IS NULL OR standardization_mode = item_map.approved_mode);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'approved SKU mapping changed during backfill' USING ERRCODE = '40001';
    END IF;
    UPDATE catalog.price_policy
    SET is_primary = policy_map.is_primary,
        risk_buffer_bps = policy_map.risk_buffer_bps
    WHERE organization_id = p_organization_id AND id = policy_id
      AND version = policy_map.canonical_policy_version;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'approved price policy changed during backfill' USING ERRCODE = '40001';
    END IF;
  END IF;

  IF price_map.source_currency = order_row.currency THEN
    effective_rate := 1;
    effective_unit_price := price_map.source_unit_price;
  ELSE
    effective_rate := round(price_map.fx_raw_market_rate * (10000 + price_map.fx_risk_buffer_bps) / 10000, 12);
    effective_unit_price := round(price_map.source_unit_price * effective_rate, 4);
    fx_fingerprint := encode(digest(format('%s|%s|%s|%s|%s|%s', p_organization_id, price_map.source_currency, order_row.currency, price_map.fx_raw_market_rate, price_map.fx_risk_buffer_bps, effective_rate), 'sha256'), 'hex');
    INSERT INTO orders.fx_snapshot_v2 (organization_id, base_currency, quote_currency, raw_market_rate, risk_buffer_bps, effective_rate, source, captured_at, fingerprint)
    VALUES (p_organization_id, price_map.source_currency, order_row.currency, price_map.fx_raw_market_rate, price_map.fx_risk_buffer_bps, effective_rate, 'APPROVED_H05_MAPPING', captured_at, fx_fingerprint)
    ON CONFLICT (organization_id, fingerprint) DO NOTHING;
    SELECT id INTO new_fx_snapshot_id FROM orders.fx_snapshot_v2 WHERE organization_id = p_organization_id AND fingerprint = fx_fingerprint;
  END IF;
  calculated_line_amount := round(effective_unit_price * item_row.quantity, 4);
  IF effective_unit_price > 999999999999999.9999 OR calculated_line_amount > 999999999999999.9999 THEN
    RAISE EXCEPTION 'v2 decimal overflow before backfill write' USING ERRCODE = '22003';
  END IF;

  price_fingerprint := encode(digest(format('%s|%s|%s|%s|%s|%s|%s|%s', p_organization_id, item_row.id, item_map.approved_mode, item_row.item_name, item_row.unit, price_map.source_currency, price_map.source_unit_price, item_row.item_kind), 'sha256'), 'hex');
  INSERT INTO catalog.price_snapshot_v2 (organization_id, item_kind, sku_id, standardization_mode, item_name, unit, source_kind, source_currency, source_unit_price, source_policy_id, captured_at, fingerprint)
  VALUES (p_organization_id, item_row.item_kind, item_map.sku_id, item_map.approved_mode, item_row.item_name, item_row.unit, CASE WHEN item_row.item_kind = 'STANDARD' THEN 'CATALOG_POLICY' ELSE 'MANUAL_QUOTE' END, price_map.source_currency, price_map.source_unit_price, policy_id, captured_at, price_fingerprint)
  ON CONFLICT (organization_id, fingerprint) DO NOTHING;
  SELECT id INTO new_price_snapshot_id FROM catalog.price_snapshot_v2 WHERE organization_id = p_organization_id AND fingerprint = price_fingerprint;

  UPDATE orders.order_item
  SET line_id = COALESCE(line_id, id),
      v2_snapshot_version = 1,
      standardization_mode = item_map.approved_mode,
      order_currency_v2 = order_row.currency,
      source_price_currency = price_map.source_currency,
      source_unit_price = price_map.source_unit_price,
      effective_unit_price_v2 = effective_unit_price,
      line_amount_v2 = calculated_line_amount,
      unit_price = effective_unit_price,
      line_amount = calculated_line_amount,
      currency = order_row.currency,
      price_snapshot_v2_id = new_price_snapshot_id,
      fx_snapshot_v2_id = new_fx_snapshot_id,
      price_source_kind = CASE WHEN item_row.item_kind = 'STANDARD' THEN 'CATALOG_POLICY' ELSE 'MANUAL_QUOTE' END,
      price_captured_at = captured_at
  WHERE organization_id = p_organization_id AND id = p_order_item_id;
  UPDATE orders.order_header oh
  SET total_amount = totals.total_amount,
      version = oh.version + 1,
      updated_at = captured_at
  FROM (SELECT COALESCE(sum(oi.line_amount), 0)::numeric(19,4) AS total_amount FROM orders.order_item oi WHERE oi.organization_id = p_organization_id AND oi.order_id = order_row.id) totals
  WHERE oh.organization_id = p_organization_id AND oh.id = order_row.id;

  INSERT INTO migration_v2.backfill_item
    (run_id, organization_id, order_item_id, source_sku_id, approved_mode, source_price_currency, source_unit_price, fx_raw_market_rate, fx_risk_buffer_bps, replacement_price_snapshot_v2_id, replacement_fx_snapshot_v2_id, disposition, approved_by, source_ref, applied_at)
  VALUES
    (p_run_id, p_organization_id, p_order_item_id, item_map.sku_id, item_map.approved_mode, price_map.source_currency, price_map.source_unit_price, price_map.fx_raw_market_rate, price_map.fx_risk_buffer_bps, new_price_snapshot_id, new_fx_snapshot_id, 'APPLIED', item_map.approved_by, item_map.source_ref, captured_at);
  INSERT INTO migration_v2.backfill_count (run_id, organization_id, item_kind, disposition, row_count)
  VALUES (p_run_id, p_organization_id, item_row.item_kind, 'APPLIED', 1)
  ON CONFLICT (run_id, organization_id, item_kind, disposition) DO UPDATE SET row_count = migration_v2.backfill_count.row_count + 1;
  RETURN 'APPLIED';
END;
$$;

CREATE OR REPLACE FUNCTION migration_v2.finish_backfill_run(p_run_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  gaps bigint;
  applied bigint;
  expected bigint;
  evidence bigint;
  missing bigint;
  run_status text;
BEGIN
  SELECT total_count INTO expected FROM migration_v2.backfill_run WHERE run_id = p_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'backfill run does not exist' USING ERRCODE = '22023'; END IF;
  DELETE FROM migration_v2.backfill_count WHERE run_id = p_run_id;
  INSERT INTO migration_v2.backfill_count (run_id, organization_id, item_kind, disposition, row_count)
  SELECT bi.run_id, bi.organization_id, COALESCE(oi.item_kind, 'UNKNOWN'), bi.disposition, count(*)
  FROM migration_v2.backfill_item bi
  LEFT JOIN orders.order_item oi
    ON oi.organization_id = bi.organization_id AND oi.id = bi.order_item_id
  WHERE bi.run_id = p_run_id
  GROUP BY bi.run_id, bi.organization_id, COALESCE(oi.item_kind, 'UNKNOWN'), bi.disposition;
  SELECT count(*) FILTER (WHERE disposition = 'GAP'), count(*) FILTER (WHERE disposition = 'APPLIED'), count(*) INTO gaps, applied, evidence
  FROM migration_v2.backfill_item WHERE run_id = p_run_id;
  missing := GREATEST(expected - evidence, 0);
  run_status := CASE WHEN gaps = 0 AND evidence = expected THEN 'APPLIED' ELSE 'GAPS' END;
  UPDATE migration_v2.backfill_run
  SET applied_count = COALESCE(applied, 0), gap_count = COALESCE(gaps, 0) + missing, status = run_status, finished_at = clock_timestamp()
  WHERE run_id = p_run_id;
  RETURN run_status;
END;
$$;

COMMIT;

BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
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
