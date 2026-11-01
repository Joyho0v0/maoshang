# Rehearsal down and post-data forward-fix

`pre-data-down.sql` is an exact, guarded down path for an empty v2 expansion
on a disposable database. It checks both snapshot tables and every durable v2
column with `IS NOT NULL` before dropping anything. It explicitly treats
`is_primary=false` as written data. If any fact exists, it exits non-zero and
the transaction preserves the data and objects. It never truncates or resets.

`post-data-forward-fix.sql` is the exact data-preserving recovery path. It
requires the simplified expansion, then validates the staged FK/CHECK
constraints in one bounded transaction. An invalid fact aborts and leaves the
database untouched for an owner-approved code or forward-fix change. It does
not infer values, rewrite rows, or execute a hidden initialization operation.
