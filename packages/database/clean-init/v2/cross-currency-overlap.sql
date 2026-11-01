-- Deliberate pre-006 ambiguity fixture. It is synthetic and must fail closed.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO org.organization (id, code, name, status, version)
VALUES ('21212121-2121-4121-8121-212121212121', 'SYN-OVERLAP-ORG', 'Synthetic Overlap Organization', 'ACTIVE', 1);
INSERT INTO catalog.product (id, organization_id, product_code, name, unit, status, metadata, version)
VALUES ('22222222-2222-4222-8222-222222222222', '21212121-2121-4121-8121-212121212121', 'SYN-OVERLAP-PROD', 'Synthetic Overlap Product', 'piece', 'ACTIVE', '{"synthetic":true}', 1);
INSERT INTO catalog.sku (id, organization_id, product_id, sku_code, name, unit, base_unit, tracking_mode, low_stock_threshold, price, status, metadata, version)
VALUES ('23232323-2323-4232-8232-232323232323', '21212121-2121-4121-8121-212121212121', '22222222-2222-4222-8222-222222222222', 'SYN-OVERLAP-SKU', 'Synthetic Overlap SKU', 'piece', 'piece', 'NONE', 0, 10.0000, 'ACTIVE', '{"synthetic":true}', 1);
INSERT INTO catalog.price_policy (id, organization_id, sku_id, currency, unit_price, valid_from, valid_to, version, is_primary, risk_buffer_bps)
VALUES
  ('24242424-2424-4242-8242-242424242424', '21212121-2121-4121-8121-212121212121', '23232323-2323-4232-8232-232323232323', 'USD', 10.0000, '2026-11-01T00:00:00Z', '2026-11-20T00:00:00Z', 1, true, 25),
  ('25252525-2525-4252-8252-252525252525', '21212121-2121-4121-8121-212121212121', '23232323-2323-4232-8232-232323232323', 'EUR', 11.0000, '2026-11-10T00:00:00Z', NULL, 1, true, 25);
COMMIT;
