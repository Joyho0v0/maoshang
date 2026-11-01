-- Review-only synthetic seed. Never run against shared, staging, production,
-- or an identity-unknown database. This is a fixture generator, not a writer.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
SET LOCAL TIME ZONE 'UTC';

DO $$
DECLARE
  owned_table text;
  row_count bigint;
BEGIN
  IF current_database() !~ '^be_imp_04_cleaninit_[a-z0-9_]+$'
     OR current_setting('review_v2.project_marker', true) IS DISTINCT FROM 'JOYHO-33'
     OR current_setting('review_v2.disposable', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'clean-init seed refused: target identity or disposable marker is not approved' USING ERRCODE = '55000';
  END IF;
  FOREACH owned_table IN ARRAY ARRAY[
    'core.organization', 'core.user_account', 'integration.idempotency_record', 'integration.outbox_event', 'integration.inbox_consumption',
    'audit.event', 'audit.audit_event', 'audit.authentication_event', 'integration.identity_outbox_event', 'integration.login_attempt_bucket',
    'org.organization', 'org.business_group', 'org.membership', 'org.position_history', 'iam.user_account', 'iam.session',
    'iam.user_role_binding', 'iam.user_data_scope', 'iam.data_scope_group',
    'files.file_object', 'files.upload_intent', 'files.file_link', 'files.scan_result',
    'crm.customer', 'crm.customer_contact', 'crm.customer_approval_attempt', 'crm.customer_assignment_history',
    'catalog.product', 'catalog.sku', 'catalog.price_policy', 'catalog.price_snapshot', 'catalog.exchange_rate_snapshot',
    'catalog.price_snapshot_v2', 'orders.fx_snapshot_v2', 'orders.order_header', 'orders.order_item', 'orders.stage_history', 'orders.ownership_history'
  ] LOOP
    IF to_regclass(owned_table) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM %s', owned_table) INTO row_count;
      IF row_count <> 0 THEN
        RAISE EXCEPTION 'clean-init seed refused: % has % existing rows', owned_table, row_count USING ERRCODE = '55000';
      END IF;
    END IF;
  END LOOP;
END $$;

INSERT INTO org.organization (id, code, name, status, version)
VALUES ('66666666-6666-4666-8666-666666666666', 'SYN-JOYHO33', 'Synthetic Organization 1', 'ACTIVE', 1);
INSERT INTO org.business_group (id, organization_id, code, name, status, version)
VALUES ('99999999-9999-4999-8999-999999999999', '66666666-6666-4666-8666-666666666666', 'SYN-GROUP-1', 'Synthetic Group 1', 'ACTIVE', 1);
INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name, status, version, authz_version, session_epoch)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '66666666-6666-4666-8666-666666666666', 'OIDC_SSO', 'synthetic-user-1', 'synthetic-user-1@example.invalid', 'Synthetic User 1', 'ACTIVE', 1, 1, 1);
INSERT INTO catalog.product (id, organization_id, product_code, name, unit, status, metadata, version)
VALUES ('88888888-8888-4888-8888-888888888888', '66666666-6666-4666-8666-666666666666', 'SYN-PROD-1', 'Synthetic Product 1', 'piece', 'ACTIVE', '{"synthetic":true}', 1);
INSERT INTO catalog.sku (id, organization_id, product_id, sku_code, name, unit, base_unit, tracking_mode, low_stock_threshold, price, status, metadata, version, standardization_mode)
VALUES ('11111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', '88888888-8888-4888-8888-888888888888', 'SYN-SKU-1', 'Synthetic SKU 1', 'piece', 'piece', 'NONE', 0, 19.9900, 'ACTIVE', '{"synthetic":true}', 1, 'STRICT');
INSERT INTO catalog.price_policy (id, organization_id, sku_id, currency, unit_price, valid_from, valid_to, version, is_primary, risk_buffer_bps)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', 'USD', 19.9900, '2026-11-01T00:00:00Z', NULL, 1, true, 25);
INSERT INTO crm.customer (id, organization_id, name, owner_user_id, business_group_id, status, contacts, version)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '66666666-6666-4666-8666-666666666666', 'Synthetic Customer 1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-9999-4999-8999-999999999999', 'DRAFT', '[]', 1);
INSERT INTO orders.order_header (id, organization_id, customer_id, order_no, owner_user_id, business_group_id, currency, status, stage, total_amount, metadata, version)
VALUES ('55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'SYN-ORDER-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-9999-4999-8999-999999999999', 'USD', 'DRAFT', 'INITIAL_CONTACT', 39.9800, '{"synthetic":true}', 1);
INSERT INTO catalog.price_snapshot_v2 (id, organization_id, item_kind, sku_id, standardization_mode, item_name, unit, source_kind, source_currency, source_unit_price, source_policy_id, captured_at, fingerprint)
VALUES ('77777777-7777-4777-8777-777777777777', '66666666-6666-4666-8666-666666666666', 'STANDARD', '11111111-1111-4111-8111-111111111111', 'STRICT', 'Synthetic SKU 1', 'piece', 'CATALOG_POLICY', 'USD', 19.9900, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-11-01T00:00:01Z', repeat('1', 64));
INSERT INTO orders.order_item (id, organization_id, order_id, line_no, item_kind, sku_id, item_name, unit, quantity, unit_price, line_amount, currency, product_snapshot, line_id, v2_snapshot_version, standardization_mode, order_currency_v2, source_price_currency, source_unit_price, effective_unit_price_v2, line_amount_v2, price_snapshot_v2_id, price_source_kind, price_captured_at)
VALUES ('44444444-4444-4444-8444-444444444444', '66666666-6666-4666-8666-666666666666', '55555555-5555-4555-8555-555555555555', 1, 'STANDARD', '11111111-1111-4111-8111-111111111111', 'Synthetic SKU 1', 'piece', 2.000000, 19.9900, 39.9800, 'USD', '{"synthetic":true}', '33333333-3333-4333-8333-333333333333', 1, 'STRICT', 'USD', 'USD', 19.9900, 19.9900, 39.9800, '77777777-7777-4777-8777-777777777777', 'CATALOG_POLICY', '2026-11-01T00:00:01Z');

SELECT 'CLEAN_INIT_SEED_ROWS' AS evidence, (SELECT count(*) FROM catalog.sku) AS skus, (SELECT count(*) FROM catalog.price_policy) AS policies, (SELECT count(*) FROM orders.order_item WHERE v2_snapshot_version IS NOT NULL) AS complete_v2_items;
COMMIT;
