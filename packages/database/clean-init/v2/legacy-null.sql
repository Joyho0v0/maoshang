-- Real v1-shaped writes, executed after 001..004 and before review 005/006.
-- No v2 column is mentioned: NULL facts come from the legacy writer shape.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO org.organization (id, code, name, status, version)
VALUES ('12121212-1212-4121-8121-121212121212', 'SYN-LEGACY-ORG', 'Synthetic Legacy Organization', 'ACTIVE', 1);
INSERT INTO org.business_group (id, organization_id, code, name, status, version)
VALUES ('13131313-1313-4131-8131-131313131313', '12121212-1212-4121-8121-121212121212', 'SYN-LEGACY-GROUP', 'Synthetic Legacy Group', 'ACTIVE', 1);
INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name, status, version, authz_version, session_epoch)
VALUES ('14141414-1414-4141-8141-141414141414', '12121212-1212-4121-8121-121212121212', 'OIDC_SSO', 'synthetic-legacy-user', 'synthetic-legacy@example.invalid', 'Synthetic Legacy User', 'ACTIVE', 1, 1, 1);
INSERT INTO catalog.product (id, organization_id, product_code, name, unit, status, metadata, version)
VALUES ('15151515-1515-4151-8151-151515151515', '12121212-1212-4121-8121-121212121212', 'SYN-LEGACY-PROD', 'Synthetic Legacy Product', 'piece', 'ACTIVE', '{"synthetic":true}', 1);
INSERT INTO catalog.sku (id, organization_id, product_id, sku_code, name, unit, base_unit, tracking_mode, low_stock_threshold, price, status, metadata, version)
VALUES ('16161616-1616-4161-8161-161616161616', '12121212-1212-4121-8121-121212121212', '15151515-1515-4151-8151-151515151515', 'SYN-LEGACY-SKU', 'Synthetic Legacy SKU', 'piece', 'piece', 'NONE', 0, 7.5000, 'ACTIVE', '{"synthetic":true}', 1);
INSERT INTO catalog.price_policy (id, organization_id, sku_id, currency, unit_price, valid_from, valid_to, version)
VALUES ('17171717-1717-4171-8171-171717171717', '12121212-1212-4121-8121-121212121212', '16161616-1616-4161-8161-161616161616', 'USD', 7.5000, '2026-11-01T00:00:00Z', NULL, 1);
INSERT INTO crm.customer (id, organization_id, name, owner_user_id, business_group_id, status, contacts, version)
VALUES ('18181818-1818-4181-8181-181818181818', '12121212-1212-4121-8121-121212121212', 'Synthetic Legacy Customer', '14141414-1414-4141-8141-141414141414', '13131313-1313-4131-8131-131313131313', 'DRAFT', '[]', 1);
INSERT INTO orders.order_header (id, organization_id, customer_id, order_no, owner_user_id, business_group_id, currency, status, stage, total_amount, metadata, version)
VALUES ('19191919-1919-4191-8191-191919191919', '12121212-1212-4121-8121-121212121212', '18181818-1818-4181-8181-181818181818', 'SYN-LEGACY-ORDER', '14141414-1414-4141-8141-141414141414', '13131313-1313-4131-8131-131313131313', 'USD', 'DRAFT', 'INITIAL_CONTACT', 7.5000, '{"synthetic":true}', 1);
INSERT INTO orders.order_item (id, organization_id, order_id, line_no, item_kind, sku_id, item_name, unit, quantity, unit_price, line_amount, currency, product_snapshot)
VALUES ('20202020-2020-4202-8202-202020202020', '12121212-1212-4121-8121-121212121212', '19191919-1919-4191-8191-191919191919', 1, 'STANDARD', '16161616-1616-4161-8161-161616161616', 'Synthetic Legacy SKU', 'piece', 1.000000, 7.5000, 7.5000, 'USD', '{"synthetic":true}');
COMMIT;
