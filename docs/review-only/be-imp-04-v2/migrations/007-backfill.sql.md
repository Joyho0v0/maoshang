# 007 backfill rehearsal

The exact review-only SQL is [007-backfill.sql](./007-backfill.sql). It is
not a formal migration and contains no owner-supplied H-05 values.

The three functions accept typed arguments, bind a run to one input SHA-256,
load only durable approved mapping tables, lock the order item and parent in a
fixed order, create deterministic replacement snapshot fingerprints, and
record every applied or gap row. An APPLIED row is idempotent. A GAP row is
retained as evidence but can be retried after an approved mapping is added to
the same run; final aggregate counts are rebuilt from the durable item rows.
finish_backfill_run leaves the run GAPS until the owner resolves every gap,
and only returns APPLIED when the gap count is zero.

Execute it only after 005 and 006 in an isolated PostgreSQL 16 database, then
call the functions with synthetic fixtures. Do not infer a mode from
tracking_mode, current price, a global default, or JSONB.
