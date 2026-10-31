# 005 expand rehearsal

The exact review-only SQL is [005-expand.sql](./005-expand.sql). It is not a
formal migration and must not be copied into packages/database/migrations.
It is idempotent, uses a two-second lock timeout and a thirty-second statement
timeout, adds only nullable v2 columns/tables or NOT VALID checks/FKs, and does
not rewrite migration 004.

Run it with psql --set ON_ERROR_STOP=1 --file 005-expand.sql only after 001–004
have been applied to a disposable PostgreSQL 16 database. Re-running the file
is part of the rehearsal. The SQL includes organization-scoped FKs, supporting
indexes, approved-input tables, durable run/item/count provenance tables, and
append-only policy fact evidence.
The durable `backfill_manifest` table freezes the digest-bound input set without
an order-item FK; `backfill_run.unexpected_count` records evidence outside that
set so malformed evidence cannot look applied. `policy_fact_evidence` records
the one successful policy CAS per run/digest/policy, including the expected and
applied canonical versions and approved target facts. No H-05 business values
are included.
