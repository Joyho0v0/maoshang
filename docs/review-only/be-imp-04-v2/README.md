# BE-IMP-04 Catalog + Orders v2 review package

Status: `PENDING_REVIEW`. This directory is a review-only candidate. It is not
a runtime contract, is not included by the v1 generator, and must not be
copied over the frozen v1 artifact or generated files.

The package is intentionally self-contained:

- `openapi.yaml` is the complete parseable v2 candidate with 18 operations.
  Four Order/catalog contract decisions remain `HUMAN_INPUT_REQUIRED`; this
  package does not invent their endpoint or schema semantics.
- `validate.mjs` is the single review entry point. It performs parser,
  dereference, independent contract checks, AJV fixture validation, real
  temporary types/client/runtime-validator generation, request-gate tests,
  and the v1/v2 consumer harness.
- `fixtures.json` contains v2 request/response and Problem examples. Invalid
  examples must be rejected before the generated client calls `fetch`.
- `clean-init/` contains the fail-closed preflight and synthetic seed schemas,
  redacted examples, an exact empty-database seed SQL fixture, schema
  inventory SQL, and the dual-version consumer harness. It contains no real
  business data, credentials, object keys, or production values.
- `migrations/005-expand.sql` and `migrations/006-dual-version.sql` are exact
  review-only expand/validation rehearsal SQL. They add only nullable v2
  columns, snapshot tables, FK/CHECK/index protections, and immutable snapshot
  triggers. They are never formal migrations and are never auto-discovered by
  the repository migration runner.
- `migrations/pre-data-down.sql` is a guarded, non-destructive pre-data down
  path. `migrations/post-data-forward-fix.sql` only validates existing facts;
  neither file resets, truncates, deletes, or invents data.

## Review-only commands

Use the repository's pinned Node/npm toolchain from the repository root:

```bash
node --version  # Node 22.22.3
npm --version   # npm 11.6.2
node docs/review-only/be-imp-04-v2/validate.mjs
```

The validator uses installed dependencies only and creates/removes its
temporary generation directory itself. It does not install packages, execute
SQL, select a database, or modify the v1 artifact.

The repository OpenAPI gate remains the authoritative v1 check:

```bash
npm run lint:openapi
npm run contract:breaking
```

No optional unpinned `npm exec` command is part of this gate.

## Clean initialization boundary

This review candidate assumes a new, uniquely named, disposable local
PostgreSQL 16 database. It does not perform an in-place reset. Before any seed
statement, `clean-init/preflight-report.schema.json` requires the project
marker, `disposable=true`, live database identity, owner/recovery/read-only
facts, cluster identity when available, migration and seed digests, per-table
row counts, organization set, active-session count, approval and recovery
strategy. Secrets are excluded by schema-level `additionalProperties: false`.

`clean-init/seed.sql` requires session settings for the project marker and
disposable target, an exact clean-init database-name pattern, and zero rows in
the owned-domain table set before inserting synthetic organization, catalog,
customer, order, price-policy, price-snapshot, and complete v2 order-item
facts. It never uses upsert. A non-empty or identity-mismatched target fails
before any write. The synthetic seed gives every orderable SKU an explicit
standardization mode, active primary policy, currency, validity, and risk
buffer; it does not imply production pricing.

`clean-init/smoke.sql` checks the seeded immutable snapshot shape, no legacy
null in the synthetic seed, and the remaining legacy-null `UNCLASSIFIED`
fail-closed compatibility path. A clean seed does not justify global NOT NULL:
v1 writers may still create legacy-null rows during coexistence, while v2
application validation must return `409 STATE_CONFLICT / UNCLASSIFIED`.

## Dual-version and security boundary

The v1 OpenAPI/generated client/runtime and digest remain byte-identical. The
review harness loads the actual v1 generated client and validator together
with the generated v2 client and validator in separate adapters. It proves
v1 Customer and v2 Order paths/query keys do not cross, idempotency identity
includes the versioned operation, v2 hrefs never fall back to `/api/v1/`,
502/503 remain result-unknown/recovery, and only
`customer.submit-approval` is accepted as the capability token.

The v2 client validates request body, path, query, and header schemas before
calling `fetch`; discriminator mixing, client price/snapshot/FX/policy fields,
invalid UUIDs, malformed headers, and unknown body properties therefore have
`fetchCount=0` evidence.

## Migration rehearsal and ownership

Run only in a newly created, uniquely named local disposable database after
the real 001–004 history has been applied:

```text
001 → 004 → 005-expand → 006-dual-version
004 → 005-expand → 006-dual-version
005-expand/006-dual-version up twice
constraint validation → seed.sql → smoke.sql → cleanup
pre-data-down (empty only) → post-data-forward-fix (data-preserving)
```

`005` preserves v1 meanings and leaves v2 columns nullable. `006` stages
checks/FKs as `NOT VALID`; validation is an explicit bounded operation. The
pre-data down guard checks snapshot tables and every v2 durable column with
`IS NOT NULL`, including explicit `false` in boolean policy facts, before any
drop. The post-data forward-fix validates constraints only and stops on
invalid facts. No reset is hidden in migration, application startup, or test
bootstrap.

## Frozen compatibility facts

- `trackingMode` remains `NONE | LOT | SERIAL` and is independent of
  `standardizationMode`.
- `standardizationMode` is the only new required SKU-create input;
  `baseUnit`, `trackingMode`, and `lowStockThreshold` remain optional with
  their explicit defaults.
- STANDARD/NON_STANDARD, price/FX snapshots, Files live-parent authorization,
  Problem/recovery semantics, Order edit/cancel, response-header matrix, and
  sort/filter allowlists are only promoted after their respective exact system
  decisions and both architecture reviews.
- H-05 contains no historical conversion input for this clean-init scope. Synthetic seed
  values are test fixtures only and must never be treated as business or
  production data.
