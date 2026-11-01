# v2 response-header matrix (review-only)

This table is the human-readable mirror of the `headers` objects in
`openapi.yaml`. The YAML is authoritative for generation and runtime
validation; this document is not a second contract.

| Response family | X-Request-ID | ETag | Location | Content-Location | Cache-Control | Retry-After | Idempotent-Replay |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 200 list/auth/file | required UUID | forbidden | forbidden | forbidden | required `no-store` | forbidden | forbidden |
| 200 resource read | required UUID | required `\"vN\"` | forbidden | forbidden | required `no-store` | forbidden | forbidden |
| 200 mutation update/transition | required UUID | required `\"vN\"` | forbidden | forbidden | required `no-store` | forbidden | optional `true` only on replay |
| 200 file download intent | required UUID | forbidden | forbidden | forbidden | required `no-store` | forbidden | forbidden |
| 201 product/SKU/order create | required UUID | required `\"vN\"` | required `/api/v2/{resource}/{uuid}` | forbidden | required `no-store` | forbidden | optional `true` only on replay |
| 202 command accepted | required UUID | forbidden | forbidden | required `/api/v2/commands/status` | required `no-store` | required positive integer seconds | optional `true` only on replay |
| 200 command status, `IN_PROGRESS` | required UUID | forbidden | forbidden | required `/api/v2/commands/status` | required `no-store` | required positive integer seconds | forbidden |
| 200 command status, `RECOVERY_REQUIRED` | required UUID | forbidden | forbidden | required `/api/v2/commands/status` | required `no-store` | required `0`-ms recovery poll hint | forbidden |
| 200 command status, terminal | required UUID | forbidden | forbidden | required `/api/v2/commands/status` | required `no-store` | forbidden | forbidden |
| typed Problem 400/401/403/404/409/428 on idempotent mutation | required UUID | forbidden | forbidden | forbidden | required `no-store` | forbidden | optional `true` only on replay |
| typed Problem 400/401/403/404/409/428 on read/exempt operation | required UUID | forbidden | forbidden | forbidden | required `no-store` | forbidden | forbidden |
| typed Problem 500 terminal on idempotent mutation | required UUID | forbidden | forbidden | forbidden | required `no-store` | forbidden | optional `true` only on replay |
| typed Problem 500 recoverable, or 502/503 | required UUID | forbidden | forbidden | forbidden | required `no-store` | forbidden | forbidden |
| typed Problem 429 on idempotent mutation | required UUID | forbidden | forbidden | forbidden | required `no-store` | required positive integer seconds | optional `true` only on replay |
| typed Problem 429 on read/exempt operation | required UUID | forbidden | forbidden | forbidden | required `no-store` | required positive integer seconds | forbidden |

Known headers not declared by a response are rejected by the generated client.
Every location/content-location/status href is an origin-relative path under
`/api/v2/` and has no scheme, host, query, or fragment. `Retry-After` is a
wire hint only; `RECOVERY_REQUIRED` is represented by the CommandStatus body
with `retryAfterMs=0` and `problem=null`, not by a terminal Problem.

The generated fixture gate deletes each required 202 header independently,
injects forbidden `ETag` on a file status response, rejects invalid
`Cache-Control`, and checks the conditional command-status Retry-After rule.
