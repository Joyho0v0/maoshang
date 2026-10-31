# Rehearsal down and forward-fix

[pre-data-down.sql](./pre-data-down.sql) is the exact, guarded down path for
a disposable database before v2 data exists. It drops triggers before their
functions and tables, including `backfill_manifest_frozen` before
`guard_backfill_manifest()`, checks that no v2 evidence or item data exists,
and is safe to execute twice.

[forward-fix.sql](./forward-fix.sql) is the exact post-data recovery entry
point. It includes the idempotent 005, 006 and 007 SQL in order and is the
only supported forward-fix path in this review package. The operator must
provide an isolated DATABASE_URL, record every command and exit code, and
must not execute either file against shared or production databases.
