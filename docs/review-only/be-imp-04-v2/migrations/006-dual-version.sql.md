# 006 dual-version validation rehearsal

The exact review-only SQL is [006-dual-version.sql](./006-dual-version.sql).
It is not a formal migration. It adds the half-open price-policy exclusion
constraint, the active-primary uniqueness index, conditional v2 shape and
decimal checks as `NOT VALID`, and append-only v2 price/FX snapshot triggers.

The v2 checks are conditional on `order_item.v2_snapshot_version`, so v1 rows
may keep legacy-null v2 columns during coexistence. The policy interval is
`valid_from <= capturedAt < valid_to`; a null end is infinity. Writers must
serialize by organization/SKU and use the canonical existing
`catalog.price_policy.version`. This review package does not add a second
policy-version field or a production writer.
