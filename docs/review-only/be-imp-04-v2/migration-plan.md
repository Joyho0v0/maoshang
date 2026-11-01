# Simplified 005/006 and clean-init review plan

This is a review-only plan. Migration 004 remains immutable. The SQL under
`migrations/` is never discovered or executed by the repository migration
runner, and no file in this package performs reset, truncate, delete, or
production initialization.

## Ownership and coexistence

005 is expand-only. It adds nullable SKU policy fields, v2 price/FX snapshot
tables, order-item snapshot/line/image association columns, organization-scoped
FKs, and supporting indexes. 006 adds staged validation and immutable snapshot
triggers. Existing v1 columns preserve their existing meanings. v1 may create
legacy-null v2 facts during coexistence; v2 application validation must reject
such a resource as `409 STATE_CONFLICT` with `currentState=UNCLASSIFIED`.

No global `NOT NULL` is introduced by clean initialization. A future contract
migration may tighten a shared column only after v1 writer retirement,
whole-database null review, consumer cutover, and a new architecture review.

## Physical v2 facts

The v2 expand set is deliberately limited to:

- `catalog.sku.standardization_mode` and nullable
  `catalog.price_policy.is_primary/risk_buffer_bps`;
- `catalog.price_snapshot_v2`, with immutable source policy/quote facts;
- `orders.fx_snapshot_v2`, with immutable raw/effective rate facts;
- `orders.order_item.line_id`, `v2_snapshot_version`, standardization and
  order-currency fields, source/effective price fields, snapshot pointers,
  price source/captured-at fields, and optional `image_file_id`.

All order-item v2 values are conditional on `v2_snapshot_version`. The
STANDARD/NON_STANDARD shape, price source, same/cross-currency FX relation,
decimal bounds, FK ownership, and snapshot immutability are enforced by
database checks/triggers plus application validation. Large validation is
staged with `NOT VALID` followed by explicit `VALIDATE CONSTRAINT`.

## Clean-init preflight

`clean-init/preflight-report.schema.json` is the machine contract for a
preflight report. It requires:

1. project ID, environment class, project marker, and `disposable=true`;
2. live database name/OID/owner/host/port, read-only and recovery flags, and
   cluster identifier when available;
3. expected/observed 001–004 and v2 migration digests plus the seed digest;
4. every owned table's schema/name, row count, and organization ID set;
5. total and external active-session counts, with external sessions equal to
   zero for a proceed decision;
6. approving principal/time, executor, strategy, stop reasons, and recovery
   instructions;
7. schema-level rejection of secret-like fields.

The only proceed strategy is `NEW_DATABASE`. A report with an unknown target,
shared/staging/production class, marker mismatch, non-empty owned rows,
external sessions, checksum drift, read-only/recovery mode, or missing owner
approval is a valid STOP report but cannot authorize seed.

## Synthetic seed

`clean-init/seed-manifest.schema.json` and its example are version-controlled
test data, not business input. The manifest is explicitly synthetic and
contains no contacts, object keys, credentials, or production values. Every
orderable SKU has an explicit mode, active/primary policy, currency,
half-open validity and risk buffer. Every seeded Order Item has a stable line
ID, source/effective price facts, an immutable price snapshot and a required
nullable FX snapshot (null for same currency).

`clean-init/seed.sql` accepts only a new database whose name matches the
clean-init pattern, whose session has the project marker/disposable settings,
and whose owned-domain rows are all zero. It performs ordinary inserts only;
there is no upsert or overwrite path. The seed is a fixture generator, not a
runtime v2 writer. It is never run against a shared or production database.
`clean-init/smoke.sql` checks the seeded rows and the separate synthetic
legacy-null fail-closed example.

## Rehearsal matrix

On a new local PostgreSQL 16 database only:

| Path | Required evidence |
| --- | --- |
| fresh | 001→004→005→006 exits 0; schema inventory has no cancelled engine objects |
| upgrade | empty 004→005→006 exits 0; v1 tables and rows remain unchanged |
| up/up | 005 and 006 reapply exits 0 without duplicate objects |
| validate | every staged FK/CHECK validates with exit 0 on empty/seed fixture |
| seed | preflight PROCEED, seed exit 0, no unknown-row overwrite |
| smoke | complete v2 snapshot facts, policy and currency invariants pass |
| pre-data down | empty expansion exits 0 twice; any v2 fact exits non-zero before drop |
| forward-fix | post-data validation is data-preserving and rejects invalid facts |
| cleanup | database is explicitly dropped and a `pg_database` pattern query is empty |

The current package does not execute these commands automatically. The review
record must preserve the exact database name, command, exit code, row/object
counts and cleanup query for each isolated run.

## Explicit non-goals

There is no historical legacy-data conversion, replacement snapshot/repoint workflow,
run ledger, gap count, or input approval table in this package. Existing v1
and v2 contract decisions for Order edit/cancel, response headers and
sort/filter remain pending the Chief Web Systems Architect's exact decision;
this migration plan does not select their API semantics.
