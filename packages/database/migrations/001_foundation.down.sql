-- This migration owns only the objects below. Shared schemas stay in place and
-- unrelated objects are never removed by a rollback.
DROP TABLE IF EXISTS audit.event;
DROP TABLE IF EXISTS integration.outbox_event;
DROP TABLE IF EXISTS integration.idempotency_record;
DROP TABLE IF EXISTS core.user_account;
DROP TABLE IF EXISTS core.organization;
