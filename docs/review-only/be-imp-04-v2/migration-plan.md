# 005+ review plan and validation matrix

This is a review plan. The exact SQL rehearsal files are kept under this
directory so the repository migration runner cannot discover or execute them
accidentally. They are not formal migrations and no backfill input is present
in this package.

## Ownership and compatibility

Migration 004 remains immutable. 005 is expand-only and leaves every existing
v1 column and constraint usable. v1 continues to read/write its existing
`catalog.price_snapshot.currency/unit_price`, `exchange_rate_snapshot.rate`,
and `orders.order_item.unit_price` meanings (effective order-currency values as
defined by the v1 implementation). v2 never interprets those columns as its
source quote. v2 reads only its own `*_v2` snapshot tables and item columns.
When a v2 writer must satisfy a legacy NOT NULL column, it writes the v2
effective order-currency unit price into legacy `order_item.unit_price` and
records the authoritative source/effective facts in the v2 columns; it never
uses the legacy column to reconstruct a v2 snapshot.

005-expand.sql creates nullable expansion columns/tables with no guessed
defaults for legacy policy rows, plus `NOT VALID` checks/FKs.
006-dual-version.sql adds v2-only validation functions, immutable snapshot
protections, and the dual-version writer contract. 007-backfill.sql
contains only the approved mapping import and durable run/evidence model.
pre-data-down.sql and forward-fix.sql are exact rehearsal paths. A later
contract migration may validate and tighten constraints only after
`unmapped_count=0`, v1 writer retirement, and a successful compatibility run.

## Policy lifecycle

The policy interval is half-open: `valid_from <= captured_at AND
captured_at < valid_to`; a null `valid_to` means infinity. The selection clock
is the database transaction's UTC `statement_timestamp()` captured once before
the policy query. Same-currency active policies win. Otherwise exactly one
active primary policy is required. The one canonical policy version is the
existing authoritative `catalog.price_policy.version`; there is no parallel
`policy_version` column. A writer locks the SKU and all overlapping policies in
SKU/currency order, checks `valid_from < valid_to`, rejects overlap and
duplicate active primary rows, and writes a new version. `If-Match` protects
the SKU aggregate while the request `version` protects the selected policy
row; stale either value is a terminal 409. The order writer rechecks
`sku.version`, policy version, interval and captured time immediately before
writing snapshots. `risk_buffer_bps` is owned by the approved Catalog pricing
role and is constrained to 0..2000. `SkuV2.pricePolicies[]` is the consumer
projection of `policyId`, canonical `version`, `lifecycle`, currency, price,
validity, primary flag and risk buffer for CREATE/REPLACE/END follow-up.

The SQL draft uses `btree_gist` and an exclusion constraint for interval
overlap. Existing rows are not silently backfilled; a legacy null policy is
`UNCLASSIFIED` and v2 order creation returns terminal 409 STATE_CONFLICT until
the business owner supplies a mapping.

## Decimal and FX arithmetic

All API/domain arithmetic uses decimal strings and integer-scaled decimal
operations. The physical boundaries are quantity `numeric(18,6)`, amount and
unit price `numeric(19,4)`, and rate `numeric(24,12)`. The accepted textual
boundaries are therefore quantity 1--12 integer digits plus 0--6 fractional
digits (strictly positive), amount 0--15 integer digits plus 0--4 fractional
digits (non-negative), and rate 1--12 integer digits plus 0--12 fractional
digits (strictly positive). Leading-zero fractions are accepted only when the
value is non-zero and within scale, so `0.000001` is valid and
`0.0000001` is rejected. `riskBufferBps` is an integer in `[0,2000]`.

For a cross-currency STANDARD line the immutable facts are calculated in this
order, with half-up rounding at the stated scale:

```text
effectiveRate = roundHalfUp(rawMarketRate * (10000 + riskBufferBps) / 10000, 12)
effectiveUnitPrice = roundHalfUp(sourceUnitPrice * effectiveRate, 4)
lineAmount = roundHalfUp(effectiveUnitPrice * quantity, 4)
```

The service rejects an input if any intermediate or final value exceeds its
physical integer precision, or if the order total sum overflows amount scale,
before opening the business write transaction. PostgreSQL CHECKs remain the
last defense and map any unexpected violation to an internal defect/recovery
classification rather than client-controlled SQL detail.

## Backfill input and provenance

The only accepted input is an owner-approved UTF-8 CSV with this header:

```text
organization_id,order_item_id,sku_id,standardization_mode,policy_id,canonical_policy_version,is_primary,source_price_currency,source_unit_price,fx_raw_market_rate,fx_risk_buffer_bps,approved_by,source_ref
```

Each row is keyed by `(organization_id, order_item_id)`; `sku_id`, the
owner-approved `standardization_mode`, and all price/policy/FX facts are
checked against the referenced historical item. Approved policy input carries
`policy_id`, `canonical_policy_version` (mapped to `price_policy.version`),
`is_primary`, and `risk_buffer_bps`; it is applied to the nullable expand facts
and never inferred from tracking mode, current price, or a default. A row is
rejected if it contains an unapproved source reference or omits a required
cross-currency fact. Every mapping read must match the run's input digest and
approver, and its `source_ref` is the run source or a run-scoped child such as
`<run-source>/order-item/<id>`.

The input digest, approval principal, source reference, and frozen input-item
manifest are stored in `migration_v2.backfill_run` and
`migration_v2.backfill_manifest`; the manifest has no target-order-item FK, so
an object that does not exist can still be represented as an approved input
member. The manifest trigger permits members only while the run is empty and
then makes the set append-only. `backfill_item` likewise deliberately has no
target-order-item FK so an `ORDER_ITEM_NOT_FOUND` gap remains durable; applied
replacement snapshot FKs remain protected. `finish_backfill_run` derives
`total_count` from the same-digest manifest, compares the exact manifest/evidence
key sets, and rebuilds per-kind/per-organization `backfill_count`. Missing or
extra evidence is `FAILED` (with `unexpected_count` recorded); zero evidence
for a non-empty manifest cannot be `APPLIED`. Re-running the same digest/run
metadata is idempotent; a different digest, approver or source is rejected.
Only RUNNING/GAPS runs accept a manifest member; APPLIED/FAILED runs reject
apply before snapshot, order, version or evidence writes. A partial run can be
resumed by the same run ID after approved inputs are supplied and does not
increment order versions twice. An incomplete run makes forward-fix refuse
with an actionable owner-mapping error instead of replaying DDL blindly.

`migration_v2.policy_fact_evidence` is the policy-level durable CAS result. Its
tenant-scoped key is `(run_id, organization_id, policy_id)` and it records the
run digest, approved principal/source, expected canonical `version`, target
`is_primary`/`risk_buffer_bps`, and the single resulting version. The policy row
is locked before the evidence lookup; the first item requires the expected
version and a facts-changing `UPDATE ... RETURNING version`, then inserts one
append-only evidence row. Later items in the same run must match that evidence
and the current policy facts/version, and reuse it without another bump. A
different run/digest/provenance or conflicting target facts cannot use a
same-looking current row as proof and fails before item/snapshot/evidence
writes.

`begin_backfill_run` uses one `INSERT ... ON CONFLICT DO NOTHING` followed by a
`FOR UPDATE` read of the final persisted run row. Both the inserted and conflict
paths compare run ID, digest, approver and source; if the run ID is absent after
the insert, the digest owner is locked and a different run ID is rejected.

The migration owner must provide the legacy SKU mapping, existing item mode
overrides, primary policy and risk-buffer values through the Leader's
`HUMAN_INPUT_REQUIRED` flow. This package intentionally contains no business
values and therefore cannot close the gap count.

## Rehearsal and promotion gates

On an isolated PostgreSQL 16 database only, run the exact files for fresh
001→007 up; 004→005→006→007 upgrade; 005/006/007 up twice; pre-data down
twice; post-data forward-fix; partial backfill retry; concurrent policy write
and concurrent order create; and `EXPLAIN (ANALYZE, BUFFERS)` for all new
lookup indexes. DDL uses `lock_timeout=2s` and `statement_timeout=30s` for
expand/validation probes; a timeout aborts the transaction and is retried by
the operator, never swallowed. Large FK/check validation is `NOT VALID` then a
separate bounded `VALIDATE CONSTRAINT` operation. Production execution is not
part of this review.

The validation matrix must prove:

1. v1 and v2 can read/write side by side without changing v1 fixtures.
2. Request and response discriminators reject mixed/half-shaped lines.
3. Decimal boundaries reject zero, scale overflow, integer overflow,
   multiplication/sum overflow and half-up overflow before a DB write.
4. Same-currency and cross-currency FX formulas use Decimal, per-line
   immutable snapshots, and the exact risk buffer formula.
5. A policy change after order creation cannot change an existing snapshot;
   concurrent policy change is caught by version recheck.
6. Files-owned status/read and download-intent operations use live parent
   authorization when a file is linked to an Order; unlinked owner polling,
   not-ready replay, parent reassign and concurrent reassign use hidden 404 and
   the canonical `/api/v2/files/{fileId}` href.
7. 4xx terminal replay, 500/502/503 recovery/takeover, cross-operation ledger
   isolation, audit/outbox rollback and same-key body conflict are all tested.
8. 005/006/007 up/up, fresh down, and forward-fix preserve the immutable v1
   rows and leave no temporary review database; down fails closed for run,
   mapping, snapshot, item-evidence and pointer residue.

## R1-R8 disposition

| finding | disposition in this package |
| --- | --- |
| R1 | Complete parseable OpenAPI with explicit operation objects; `validate.mjs` invokes `generate.mjs` for real temporary types/client/runtime-validator generation and typecheck. Promotion remains pending. |
| R2 | Typed Problem branches, typed metas, explicit recovery disposition and operation-scoped ledger rules in YAML/matrix. |
| R3 | Decimal patterns and `RiskBufferBps` bounds align with physical numeric columns; arithmetic/DB checks are specified in 006. |
| R4 | Exact idempotent DDL drafts, `NOT VALID` staging, dual-write semantics, down guard and forward-fix are specified. |
| R5 | Existing `price_policy.version` is the sole canonical version; SKU policy projection, policy/SKU If-Match ownership, stale conflict and serialized lifecycle are specified. |
| R6 | Per-item approved SKU/policy/price/FX mapping, digest/approver/source binding, authoritative count, durable missing-target gap and idempotent resume are specified. |
| R7 | Closed by system decision: Files-owned status/read/download-intent support is declared at `/api/v2/files/{fileId}` with a live parent resolver design. |
| R8 | Only `standardizationMode` is required on SKU create; existing defaulted fields are optional. |
