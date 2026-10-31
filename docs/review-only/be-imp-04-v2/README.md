# BE-IMP-04 Catalog + Orders v2 review package

Status: `PENDING_REVIEW`. This directory is a review-only candidate. It is not a
runtime contract, is not included by the v1 generator, and must not be copied
over `packages/contracts/openapi/openapi.yaml` or either frozen generated
artifact.

The package is deliberately self-contained so that architecture review can
parse and validate the candidate without promotion:

- `openapi.yaml` is a complete OpenAPI 3.1 document with explicit operations,
  request bodies, parameters, headers, responses, schemas, discriminators and
  typed Problem branches. The candidate contains 17 operations across 11 paths.
- `validate.ts` performs parser, dereference, independent contract checks, AJV
  schema compilation, fixture validation, and in-memory TypeScript/client dry
  generation. It writes no generated artifact.
- `fixtures.json` contains valid and invalid request/Problem examples. Invalid
  examples are expected to be rejected by the runtime validator.
- `problem-matrix.md` is the per-code HTTP/ledger/idempotency matrix. A ledger
  identity is `(actor, organization, operationId, idempotencyKey)`; the
  canonical body hash is compared only within that identity.
- `migrations/005-expand.sql.md`, `006-dual-version.sql.md`, and
  `007-backfill.sql.md` are executable SQL drafts embedded in Markdown for
  review. They are not migration files and are not run by this change.

## Review-only commands

From the repository root, with the repository's locked dependencies installed:

```bash
npm exec -- tsx docs/review-only/be-imp-04-v2/validate.ts
```

The validator reports parser/dereference status, operation count, unresolved
references, lint result, fixture result, schema count, and SHA-256 values for
the in-memory type/client dry outputs. A reviewer may additionally run:

```bash
npm exec -- openapi-format check docs/review-only/be-imp-04-v2/openapi.yaml
```

The exact package/tool version and exit code used for review must be recorded
by the caller. No command in this package targets a database or the v1
artifact.

## Pending system decision

`GET /api/v2/orders/{orderId}/files/{fileId}/status` is the current candidate
for the R7 status link because the Files-owned `/api/v2/files/{id}` alias has
not been approved. It is intentionally marked `x-candidate-system-boundary`.
The Chief Web Systems Architect must choose one owner before promotion. The
candidate does not claim that Files has been changed or that this endpoint
exists at runtime.

## R8 compatibility

`standardizationMode` is the only new required SKU-create input. `baseUnit`,
`trackingMode`, and `lowStockThreshold` remain optional request inputs and keep
their existing server-default semantics. The response preserves those v1
fields for compatibility; v2 does not infer standardization from tracking.
