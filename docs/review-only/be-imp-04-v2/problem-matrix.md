# v2 Problem and idempotency matrix (review-only)

The candidate uses typed Problem branches, not a free-form envelope. Every
branch fixes `status`, `code`, `retryable`, and the shape of `meta` (when the
code requires it). `ProblemCommon.violations` exists only to make the
`Problem400` all-of branch closed under JSON Schema; `Problem400` requires the
array and all other branches prohibit it by their branch schema semantics.

| HTTP | code | retryable | ledger disposition | required machine data |
| ---: | --- | :---: | --- | --- |
| 400 | `VALIDATION_FAILED` | false | `FAILED` terminal replay | `violations[]` with `field`, `reason`; `meta.kind=VALIDATION` |
| 401 | `AUTHENTICATION_REQUIRED` or `SESSION_EXPIRED` | false | terminal replay | no sensitive session detail |
| 403 | `PERMISSION_DENIED` | false | terminal replay | no meta; hidden resource policy remains separate |
| 403 | `CSRF_FAILED` | false | terminal replay | `meta.kind=CSRF`, `refreshHref=/api/v2/auth/csrf` |
| 404 | `RESOURCE_NOT_FOUND` or `COMMAND_NOT_FOUND` | false | terminal replay | no scope-disclosing detail |
| 409 | `STATE_CONFLICT` | false | terminal replay | `resourceType`, `resourceId`, `currentState` |
| 409 | `VERSION_CONFLICT` | false | terminal replay | `resourceType`, `resourceId`, `currentVersion`, `providedVersion` |
| 409 | `IDEMPOTENCY_KEY_REUSED` | false | terminal replay | `operationId`, `commandStatusHref` |
| 409 | `DUPLICATE_BUSINESS_KEY` | false | terminal replay | no internal constraint name |
| 409 | `FILE_NOT_READY` | true | `FAILED` terminal replay | `fileId`, `state`, `statusHref=/api/v2/files/{fileId}`; retry with a new key after AVAILABLE |
| 428 | `PRECONDITION_REQUIRED` | false | terminal replay | no meta; only operations that require an absent precondition expose it |
| 429 | `RATE_LIMITED` | true | terminal replay | `Retry-After` response header |
| 500 | `INTERNAL_ERROR` terminal branch | false | terminal replay | only deterministic response-contract failure |
| 500 | `INTERNAL_ERROR` recoverable branch | true | `RECOVERY_REQUIRED` | takeover/status is server-side; no false success claim |
| 502 | `DEPENDENCY_FAILURE` | true | `RECOVERY_REQUIRED` | dependency name is not exposed in detail |
| 503 | `DEPENDENCY_UNAVAILABLE` | true | `RECOVERY_REQUIRED` | `Retry-After` may be returned |

Deterministic 4xx failures commit one terminal ledger result in the same
transactional boundary as any audit/outbox work (normally no business write).
Unknown internal errors and dependency 502/503 roll back business, audit and
outbox side effects, release the lease as recovery-required, and permit a
later takeover. A response-contract validation failure is explicitly classified
as terminal before it enters the repository. The controller must never infer
the disposition from the `ProblemError` class or status alone.

The ledger identity is:

```text
actorId + organizationId + versioned operationId + Idempotency-Key
```

The canonical request body hash is stored with that identity. A second request
with the same identity and a different hash returns
`409 IDEMPOTENCY_KEY_REUSED`; a same-hash request replays the exact terminal or
successful result. Different operation IDs, including v1 versus v2, use
different ledger rows and cannot collide. Missing idempotency header is
`400 VALIDATION_FAILED` for malformed requests; a command operation that
requires the header and receives none returns the explicitly declared
`428 PRECONDITION_REQUIRED` response. Create operations are If-Match-exempt;
428 on them is not a missing If-Match branch.

`FILE_NOT_READY` is deterministic despite `retryable=true`: the current key
replays 409, and the caller creates a new key after the file is AVAILABLE.
The status href remains independently valid after an Order transaction rolls
back because Files owns `GET /api/v2/files/{fileId}`; it never contains an
Order-scoped path.
