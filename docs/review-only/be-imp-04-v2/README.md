# BE-IMP-04 Catalog + Orders v2 review package

Status: `PENDING_REVIEW`. This directory is a review-only candidate. It is not
a runtime contract, is not included by the v1 generator, and must not be
copied over the frozen v1 artifact or generated files.

The package is intentionally self-contained:

- `openapi.yaml` is the complete parseable v2 candidate with 18 operations.
  The exact Order edit/cancel, response-header, and sort/filter/cursor
  decisions are incorporated in this candidate. They are review inputs, not
  promotion approval; no competing shape or compatibility alias is retained.
- `validate.mjs` is the single review entry point. It performs parser,
  dereference, independent contract checks, AJV fixture validation, real
  temporary types/client/runtime-validator generation, request-gate tests,
  and the v1/v2 consumer harness.
- `fixtures.json` contains v2 request/response and Problem examples. Invalid
  examples must be rejected before the generated client calls `fetch`.
- `clean-init/` contains the fail-closed preflight and synthetic seed schemas,
  redacted examples, an exact empty-database seed SQL fixture, schema
  inventory SQL, the canonical `owned-object-manifest.json` used by both live
  preflight and seed guards, and the dual-version consumer harness. It contains no real
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

The preflight and seed use one version-controlled owned-object manifest rather
than a representative-table sample. Live preflight enumerates every listed
table (including `core.organization`, Catalog, Files, CRM, integration and
audit), counts each table independently, and collects that table's own
organization IDs. The rehearsal includes committed isolated negative rows in
each of those domains; each is stopped by preflight itself before seed. Missing
expand-only v2 tables are represented as zero during the 001–004 preflight and
are required by the seed after 005/006 has been applied.

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

## Exact Order and list contract

`PATCH /api/v2/orders/{id}` (`updateOrderV2`) is the sole edit operation. It
requires CSRF, Idempotency-Key, If-Match, and `order.update`. Its body is
closed to `metadata` and `lines`: metadata is a complete replacement when
present, while lines are a complete ordered replacement when present. Each
line carries `lineId: uuid|null`; null creates a line, an existing UUID edits
that Order line, and an omitted existing UUID removes it. Duplicate IDs,
duplicate image IDs, cross-Order IDs, item-kind changes, and concurrent
disappearance are rejected before a partial write. STANDARD lines are priced
by the server policy and NON_STANDARD lines quote only in the Order currency.

`POST /api/v2/orders/{id}/transitions` (`transitionOrderV2`) accepts only the
closed `ADVANCE {toStage, reason?}` or `CANCEL {reason?}` action union.
`CANCEL` cannot carry `toStage`; the reason is trimmed to 1–2048 characters.
Order status is the stage projection except that CANCELLED retains its stage
as an explicit terminal override. `capabilities` and `allowedTransitions`
are required response arrays; the latter contains closed action objects in
stable ADVANCE-then-CANCEL order and is empty for read-only or terminal state.

List query types are resource-specific. Product/SKU/Order status is a
single-value allowlisted enum; sort is an exact resource-specific union with
`-updatedAt,-id` as the explicit default and an implicit same-direction ID
tie-breaker for other single-column values. A cursor is an opaque signed v2
value bound to operation/resource/organization/scope/authz/sort/filters/page
size/last tuple. Cross-resource, cross-scope, changed-filter, duplicate, or
unknown values fail with `400 VALIDATION_FAILED` before fetch or database work.
The public client only checks the opaque `v2.<payload>.<signature>` envelope;
the server-side review gate verifies the signature and compares every bound
security/query dimension to the current request before opening a database
cursor. Tampered signatures and cross-version, endpoint, organization, scope,
sort, filter, and page-size replays are covered by the negative rehearsal.

The response-header contract is declared per response rather than inferred:
`X-Request-ID` and `Cache-Control: no-store` are required on successful
responses; resource responses additionally require `ETag`; 201 responses
require `Location`, forbid `Content-Location`, and may carry
`Idempotent-Replay`;
202 responses require canonical `Content-Location: /api/v2/commands/status`
and a positive `Retry-After`. `IN_PROGRESS` and `RECOVERY_REQUIRED` command
statuses require `Retry-After`, while terminal statuses forbid it. Every
Problem response requires `Cache-Control: no-store`; deterministic terminal
Problems returned by an idempotent mutation may additionally carry
`Idempotent-Replay: true` only on replay.
Mutation 429 and deterministic terminal 500 responses use explicit replay
components; recoverable 500/502/503 responses forbid replay while preserving
their retryable wire value. The generated runtime gate enforces this distinction
and the `Cache-Control: no-store` requirement.
All origin-relative href headers are `/api/v2/...` with no query or fragment.
The generated client reads each declared header by its canonical key and
rejects undeclared known headers.

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
preflight performs an independent live digest/identity/row-count machine gate
in addition to the JSON Schema. The
pre-data down guard checks snapshot tables and every v2 durable column with
`IS NOT NULL`, including explicit `false` in boolean policy facts, before any
drop. The post-data forward-fix validates constraints only and stops on
invalid facts. No reset is hidden in migration, application startup, or test
bootstrap.

The order-edit rehearsal is fixture-driven rather than scenario-name-driven:
it reads 21 concrete replacement/failure requests, derives commit/rollback from
the pre-lock and lock-time authoritative state, If-Match, explicit policy/Files/FX
context and dependency result, and uses `expectedOutcome` only for assertions.
It models ordered line replacement, immutable append-and-repoint snapshots,
same/cross-currency FX with fixed-point rounding, NON_STANDARD pricing, image
add/replace/remove, and independently counts audit, outbox, ledger, rollback,
recovery and replay effects. Failed and unknown-result
cases leave all durable model state unchanged; replay does not duplicate side
effects.

`clean-init/order-edit-regression.mjs` mutates the expected outcome, lock-time
stage/status, expected price, policy facts, server-side FX currency and line-ID
allocator. The gate requires all 7 mutations to be rejected with the expected
failure code where applicable, while the positive replacement fixture creates
multiple `lineId: null` rows with distinct deterministic UUIDs.

## Frozen compatibility facts

- `trackingMode` remains `NONE | LOT | SERIAL` and is independent of
  `standardizationMode`.
- `standardizationMode` is the only new required SKU-create input;
  `baseUnit`, `trackingMode`, and `lowStockThreshold` remain optional with
  their explicit defaults.
- STANDARD/NON_STANDARD, price/FX snapshots, Files live-parent authorization,
  Problem/recovery semantics, Order edit/cancel, response-header matrix, and
  sort/filter allowlists are exact review inputs and are only promoted after
  both architecture reviews.
- H-05 contains no historical conversion input for this clean-init scope. Synthetic seed
  values are test fixtures only and must never be treated as business or
  production data.

`problem-matrix.md` and `response-header-matrix.md` mirror the machine
contract for reviewer traceability; `openapi.yaml` remains authoritative.
