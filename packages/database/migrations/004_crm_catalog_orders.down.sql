-- Isolated rehearsal only. Production rollback is an additive forward-fix.
DROP TRIGGER IF EXISTS ownership_history_immutable ON orders.ownership_history;
DROP TRIGGER IF EXISTS stage_history_immutable ON orders.stage_history;
DROP FUNCTION IF EXISTS orders.reject_order_history_mutation();
DROP TRIGGER IF EXISTS exchange_rate_snapshot_immutable ON catalog.exchange_rate_snapshot;
DROP TRIGGER IF EXISTS price_snapshot_immutable ON catalog.price_snapshot;
DROP FUNCTION IF EXISTS catalog.reject_snapshot_mutation();
DROP TRIGGER IF EXISTS customer_assignment_history_immutable ON crm.customer_assignment_history;
DROP TRIGGER IF EXISTS customer_approval_attempt_transition ON crm.customer_approval_attempt;
DROP FUNCTION IF EXISTS crm.guard_customer_approval_attempt_transition();
DROP FUNCTION IF EXISTS crm.reject_customer_history_mutation();

DROP TABLE IF EXISTS orders.ownership_history;
DROP TABLE IF EXISTS orders.stage_history;
DROP TABLE IF EXISTS orders.order_item;
DROP TABLE IF EXISTS orders.order_header;
DROP TABLE IF EXISTS catalog.exchange_rate_snapshot;
DROP TABLE IF EXISTS catalog.price_snapshot;
DROP TABLE IF EXISTS catalog.price_policy;
DROP TABLE IF EXISTS catalog.sku;
DROP TABLE IF EXISTS catalog.product;
DROP TABLE IF EXISTS crm.customer_assignment_history;
DROP TABLE IF EXISTS crm.customer_approval_attempt;
DROP TABLE IF EXISTS crm.customer_contact;
DROP TABLE IF EXISTS crm.customer;

DELETE FROM iam.role_permission WHERE permission_id IN (SELECT id FROM iam.permission WHERE code = 'catalog.write');
DELETE FROM iam.permission WHERE code = 'catalog.write';
