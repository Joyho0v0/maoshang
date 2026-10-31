-- Review-only forward-fix/rehearsal entry point. Run only on an isolated
-- PostgreSQL 16 database from this directory. Each included SQL file is
-- transaction-safe and idempotent; no business backfill input is embedded.
\set ON_ERROR_STOP on
DO $$
DECLARE
  incomplete_run uuid;
BEGIN
  IF to_regclass('migration_v2.backfill_run') IS NOT NULL THEN
    SELECT run_id INTO incomplete_run
    FROM migration_v2.backfill_run
    WHERE status IN ('RUNNING', 'GAPS', 'FAILED')
       OR total_count <> applied_count + gap_count
    ORDER BY started_at, run_id
    LIMIT 1;
  END IF;
  IF incomplete_run IS NOT NULL THEN
    RAISE EXCEPTION 'forward-fix refused: backfill run % is incomplete; obtain owner-approved mapping and resume it before retrying DDL', incomplete_run USING ERRCODE = '55000';
  END IF;
END $$;
\ir 005-expand.sql
\ir 006-dual-version.sql
\ir 007-backfill.sql
