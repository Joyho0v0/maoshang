# ADR: Evolve Joint Contract v1 baseline at b06da0b

- Date: 2026-10-29
- Status: accepted

## Context

The exact candidate contract is `openapi.yaml` from revision
`a8f0d37a615e2338de4774d8d13f7498b49aa9b8`, with SHA-256
`149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984`.
The current approved baseline is preserved in the promotion archive with
SHA-256 `9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25`.
The pre-promotion inventory and decision manifest describe 2015 stable
breaking identities. Their original bytes, together with the disposition
package, are archived so that the historical review remains independently
auditable.

The promotion is a contract-baseline operation only. It does not establish a
runtime release, authorize live API behavior, approve BE-IMP-02 or JOYHO-14,
or authorize deployment, shared/production migration, production secrets, or
production readiness.

## Decision

After the controlled three-commit promotion chain is independently verified,
the candidate bytes may become the approved contract baseline. The generator
must derive baseline and candidate provenance from the actual input files and
Git history, preserve deterministic content-addressed evidence, and report a
current/approved-zero-diff state when the promoted baseline and candidate are
byte-identical. Any non-zero inventory remains review-required; no semantic
authorization is inferred from a path, schema name, or operation.

The promotion archive is immutable evidence, not a replacement for the live
inventory. The live inventory and manifest must be regenerated from the
committed P1 baseline and must retain the comparator, generator, candidate,
and source provenance required by Gate C2.

## Consequences

The contract comparator can run fail-closed against the promoted baseline while
the historical 2015-entry evidence remains available for audit. The live
state becomes a zero-difference contract view without rewriting or authorizing
the historical identities. Reviewers can compare the exact pre-promotion
bytes, disposition package, and post-promotion provenance without relying on
formatting or semantic reserialization.

This decision adds an audit package and a deterministic promotion record. It
also requires the P0, P1, and P2 commits to remain a contiguous, immutable
provenance chain; intermediate commits are not independently publishable.

## Invalidation and re-review events

Re-open this decision if any of the following occurs:

- the candidate, generated artifacts, comparator source, or disposition
  package changes;
- the baseline is promoted from a different source revision or digest;
- a future candidate produces a non-zero live inventory;
- the comparator identity or provenance model changes;
- an API consumer, security boundary, runtime behavior, deployment target, or
  database contract changes in a way not covered by this record;
- the contract requires a new semantic disposition or a new approval set.

Any such event requires a fresh Gate C2 review and a new audit record. It does
not retroactively authorize runtime promotion or production operations.

## Runtime gate boundary

`contractPromotionDoesNotAuthorizeRuntime=true` is an explicit boundary of
this decision. Runtime promotion, live API implementation, deployment,
shared/production migration, production secrets, and production readiness are
separate gates owned by their respective reviewers and operators.

## Acceptance evidence

- 接受日期：`2026-10-30`
- P2a revision：`9ba22dddd4ffd8e04cc99339398a9d445854a8ad`
- 最终 P2b revision：`241db49ca0c6f44d8f486cdff3b96e91e2c37606`
- 后端 Reviewer 评论：`01a18b61-86c6-75e3-99bc-41a5ef2601ba`
- 前端 Reviewer 评论：`01a18b66-d9ab-7c15-9bd5-4506248ec950`
- 独立 QA 评论：`01a18b6d-5add-7e6a-b403-ab6cbffc8341`
- Leader completion 评论：`01a18b70-0b12-7b4d-aa77-a5a90f818078`
