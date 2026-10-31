# 007 backfill rehearsal

The exact review-only SQL is [007-backfill.sql](./007-backfill.sql). It is
not a formal migration and contains no owner-supplied H-05 values.

The three functions bind a run to one input SHA-256 and a frozen
`backfill_manifest`, load only digest/approver/source-matched approved mapping
tables, lock the order item and parent in a fixed order, create deterministic
replacement snapshot fingerprints, and record every applied or gap row. A
policy-level `policy_fact_evidence` row is written only after the expected
canonical-version CAS changes the approved facts; it binds run/digest,
organization/policy, approver/source, target facts, and the applied version.
Later items in the same run lock and validate that evidence and reuse it without
bumping the policy again. A conflicting run, digest, provenance, policy version,
or target fact fails before snapshot/item/order/evidence writes. An APPLIED row
is idempotent only while the run is non-terminal; APPLIED/FAILED runs reject
further evidence before any business write. A GAP row is retained as evidence
but can be retried after an approved mapping is added to the same manifest
member. `finish_backfill_run` derives the authoritative count from the
manifest, rejects missing or extra evidence as FAILED, and returns APPLIED only
when the exact manifest key set is covered by non-gap evidence.

Execute it only after 005 and 006 in an isolated PostgreSQL 16 database, then
call the functions with synthetic fixtures. Do not infer a mode from
tracking_mode, current price, a global default, or JSONB.
