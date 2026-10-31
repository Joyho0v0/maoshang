# 006 dual-version rehearsal

The exact review-only SQL is [006-dual-version.sql](./006-dual-version.sql).
It is not a formal migration. It adds a half-open policy-window exclusion
constraint, a primary-policy uniqueness guard, an advisory-lock lifecycle
trigger, v2 shape/decimal checks staged as NOT VALID, and append-only v2
snapshot triggers. It preserves the v1 meanings of legacy price and exchange
columns and is safe to reapply in the rehearsal database.

The policy trigger serializes writers by organization and SKU, validates
valid_from <= captured_at < valid_to semantics, and rejects overlapping
primary windows. Later validation is explicit and is never hidden by a
swallowed exit code.
