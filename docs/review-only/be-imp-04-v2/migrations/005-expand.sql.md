# 005 expand rehearsal

The exact review-only SQL is [005-expand.sql](./005-expand.sql). It is not a
formal migration and must not be copied into `packages/database/migrations`.
It is idempotent, uses a two-second lock timeout and a thirty-second statement
timeout, and does not rewrite migration 004.

The file adds only nullable v2 business columns and v2 price/FX snapshot
tables. It adds organization-scoped foreign keys, supporting indexes, and
`NOT VALID` references for existing order rows. It does not create a historical
legacy conversion table, replacement workflow, run ledger, gap counter, or mutable
initialization state. Existing v1 price, FX, and order-item meanings remain
unchanged. A legacy-null SKU or policy remains legal for v1 and must be
reported by a v2 writer as `409 STATE_CONFLICT` with `UNCLASSIFIED`.

The SQL is applied only after 001–004 on a newly created disposable PostgreSQL
16 database. Re-running it is part of the rehearsal. Constraint validation is
separate and bounded; it is not hidden behind a swallowed exit code.
