# BE-IMP-04 Catalog + Orders v2 review package

Status: `PENDING_REVIEW`. This directory is a review-only candidate. It is not a
runtime contract, is not included by the v1 generator, and must not be copied
over `packages/contracts/openapi/openapi.yaml` or either frozen generated
artifact.

The package is deliberately self-contained so that architecture review can
parse and validate the candidate without promotion:

- `openapi.yaml` is a complete OpenAPI 3.1 document with explicit operations,
  request bodies, parameters, headers, responses, schemas, discriminators and
  typed Problem branches. The candidate contains 18 operations across 12 paths,
  including the Files-owned `GET /api/v2/files/{fileId}` and
  `POST /api/v2/files/{fileId}/download-intents` support surface.
- `validate.mjs` is the single review entry point. It performs parser,
  dereference, independent contract checks, AJV schema compilation, fixture
  validation, and invokes `generate.mjs` in a temporary directory for real
  types/client/runtime-validator generation and typecheck. It removes the
  temporary output and writes no repository artifact.
- `fixtures.json` contains valid and invalid request/Problem examples. Invalid
  examples are expected to be rejected by the runtime validator.
- `problem-matrix.md` is the per-code HTTP/ledger/idempotency matrix. A ledger
  identity is `(actor, organization, operationId, idempotencyKey)`; the
  canonical body hash is compared only within that identity.
- `migrations/005-expand.sql`, `006-dual-version.sql`, `007-backfill.sql`,
  `pre-data-down.sql`, and `forward-fix.sql` are exact review-only rehearsal
  SQL. They are not formal migrations and are never run by this change. The
  adjacent Markdown files explain their lock/scan/recovery contracts.
- `migration_v2.backfill_manifest` is the digest/approver/source-bound input
  manifest used by the rehearsal functions. Counts are derived from that
  frozen key set; target objects are intentionally not foreign-keyed so
  missing-object gaps remain durable.

## Review-only commands

From the repository root, with the repository's locked dependencies installed:

```bash
node docs/review-only/be-imp-04-v2/validate.mjs
```

The validator reports parser/dereference status, operation count, unresolved
references, lint result, fixture result, generated schema/typecheck status,
real client/runtime smoke status, and SHA-256 values. A reviewer may
additionally run:

```bash
npm exec -- openapi-format check docs/review-only/be-imp-04-v2/openapi.yaml
```

The exact package/tool version and exit code used for review must be recorded
by the caller. No command in this package targets a database or the v1
artifact.

## Files support boundary

The Chief Web Systems Architect's decision is incorporated: the canonical
Files-owned status/read href is `/api/v2/files/{fileId}`. The v2 candidate
declares `GET /api/v2/files/{fileId}` (`getFileStatusV2`) and
`POST /api/v2/files/{fileId}/download-intents`
(`createFileDownloadIntentV2`). Upload-intent and complete-upload remain v1
operations, while v2 status and final download never fall back to v1. Orders
only consumes the Files schema/href and does not own a Files endpoint.

The candidate does not claim that these Files operations have been implemented
at runtime; promotion remains pending Files-owner and backend/frontend narrow
review.

## R8 compatibility

`standardizationMode` is the only new required SKU-create input. `baseUnit`,
`trackingMode`, and `lowStockThreshold` remain optional request inputs. Their
explicit defaults are `baseUnit = unit`, `trackingMode = NONE`, and decimal
`lowStockThreshold = "0"`; omission and explicit-value fixtures are separate.
These defaults never infer standardization and never apply to legacy backfill.
The response preserves those v1 fields for compatibility.
