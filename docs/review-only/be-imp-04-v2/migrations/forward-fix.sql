-- Review-only forward-fix/rehearsal entry point. Run only on an isolated
-- PostgreSQL 16 database from this directory. Each included SQL file is
-- transaction-safe and idempotent; no business backfill input is embedded.
\set ON_ERROR_STOP on
\ir 005-expand.sql
\ir 006-dual-version.sql
\ir 007-backfill.sql
