# 005+ review plan and validation matrix

This is a review plan, not an executable migration. The SQL blocks are kept in
`.sql.md` files so the repository migration runner cannot discover or execute
them accidentally. No backfill input is present in this package.

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

005 creates nullable expansion columns/tables and `NOT VALID` checks/FKs. 006
adds v2-only validation functions, immutable snapshot protections, and the
dual-version writer contract. 007 contains only the approved mapping import
and durable run/evidence model. A later contract migration may validate and
tighten constraints only after `unmapped_count=0`, v1 writer retirement, and a
successful compatibility run.

## Policy lifecycle

The policy interval is half-open: `valid_from <= captured_at AND
captured_at < valid_to`; a null `valid_to` means infinity. The selection clock
is the database transaction's UTC `statement_timestamp()` captured once before
the policy query. Same-currency active policies win. Otherwise exactly one
active primary policy is required. A writer locks the SKU and all overlapping
policies in SKU/currency order, checks `valid_from < valid_to`, rejects overlap
and duplicate active primary rows, writes a new version, and the order writer
rechecks `sku.version`, policy version, interval and captured time immediately
before writing snapshots. `risk_buffer_bps` is owned by the approved Catalog
pricing role and is constrained to 0..2000.

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
organization_id,order_item_id,sku_id,standardization_mode,source_price_currency,source_unit_price,fx_raw_market_rate,fx_risk_buffer_bps,approved_by,source_ref
```

Each row is keyed by `(organization_id, order_item_id)`; `sku_id` and all
snapshot facts are checked against the referenced historical item. A row is
rejected if it tries to infer mode from tracking/current SKU policy, contains
an unapproved source reference, or omits a required cross-currency fact. The
input digest, approval principal, source reference, row counts, per-kind and
per-organization applied/gap counts, and every applied mapping are stored in
`migration_v2.backfill_run` / `migration_v2.backfill_item`. Re-running the same
digest is a no-op; a different digest for a completed run is rejected. A
partial run commits only its durable gap/evidence rows and can be resumed by
the same run ID; it does not increment order versions twice.

The migration owner must provide the legacy SKU mapping, existing item mode
overrides, primary policy and risk-buffer values through the Leader's
`HUMAN_INPUT_REQUIRED` flow. This package intentionally contains no business
values and therefore cannot close the gap count.

## Rehearsal and promotion gates

On an isolated PostgreSQL 16 database only, the eventual implementation must
run: fresh 001→007 up; 004→005→006→007 upgrade; 005/006/007 up twice; pre-data
down; post-data forward-fix; partial backfill retry; concurrent policy write
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
6. Files link, read, download, not-ready replay, parent reassign and concurrent
   reassign use live Order authorization and hidden 404.
7. 4xx terminal replay, 500/502/503 recovery/takeover, cross-operation ledger
   isolation, audit/outbox rollback and same-key body conflict are all tested.
8. 005/006/007 up/up, fresh down, and forward-fix preserve the immutable v1
   rows and leave no temporary review database.

## R1-R8 disposition

| finding | disposition in this package |
| --- | --- |
| R1 | Complete parseable OpenAPI with explicit operation objects; `validate.ts` performs dereference and dry generation. Promotion remains pending. |
| R2 | Typed Problem branches, typed metas, explicit recovery disposition and operation-scoped ledger rules in YAML/matrix. |
| R3 | Decimal patterns and `RiskBufferBps` bounds align with physical numeric columns; arithmetic/DB checks are specified in 006. |
| R4 | Exact idempotent DDL drafts, `NOT VALID` staging, dual-write semantics, down guard and forward-fix are specified. |
| R5 | Half-open interval, captured clock, same-currency/primary selection, exclusion and writer lock/version protocol are specified. |
| R6 | Per-item mapping, replacement snapshot fingerprint, durable run/input digest/evidence and idempotent retry are specified. |
| R7 | Candidate uses Order-scoped status resource and defines live parent authorization; Chief Architect must approve this versus a Files-owned alias. |
| R8 | Only `standardizationMode` is required on SKU create; existing defaulted fields are optional. |
