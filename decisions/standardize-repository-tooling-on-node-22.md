# ADR: Standardize repository tooling on Node 22

- Date: 2026-10-31
- Status: proposed

## Context

The root package already selects Node `22.22.3` and npm `11.6.2`, while the Web
package selected Node `24.22.1`, Node 24 API types, and no exact npm toolchain.
As a result, repository-wide gates required two runtimes and the Web install did
not mirror the fail-closed toolchain declaration used at the root.

The accepted backend runtime baseline is Node `22.22.3`. The current Vue, Vite,
vue-tsc, TypeScript `5.7.2`, and Vitest `4.1.12` versions must remain unchanged,
as must the two independent package/lock/install boundaries.

## Options considered

### Retain separate Node 22 and Node 24 runtimes

This avoids a Web lockfile update but keeps operational drift, requires two
runtime installations for one repository, and prevents a coherent aggregate
gate.

### Promote the backend to Node 24

This would align with the previous Web selection, but it would reopen the
accepted backend runtime baseline and expand the change across production
dependencies and verification without a demonstrated requirement.

### Standardize both packages on Node 22.22.3 and npm 11.6.2

This reuses the accepted backend runtime, gives both package boundaries the
same exact local and package-manager declarations, and limits dependency
movement to Node API types and their lockfile metadata.

## Proposed decision

Select Node `22.22.3` and npm `11.6.2` for both package boundaries. The root
continues to enforce those versions through `.nvmrc`, `packageManager`,
`engines`, `devEngines`, and `tools/install-locked.mjs`. The Web boundary mirrors
the runtime through `apps/web/.nvmrc`, `packageManager`, `engines`, and
`devEngines`, and pins `@types/node` to `22.10.2`.

Keep TypeScript `5.7.2`, Vitest `4.1.12`, and the existing Vue, Vite, and
vue-tsc versions unchanged. Do not combine the root and Web manifests or
lockfiles, adopt npm workspaces, or weaken the locked-install security policy.

## Consequences

One exact Node/npm pair can install, typecheck, test, and build the repository.
The Web lockfile changes only where required to mirror its manifest and resolve
Node 22 API types. Toolchain regression tests make the Web declarations
executable evidence rather than documentation only.

Consumers must explicitly activate Node `22.22.3` and npm `11.6.2`; running the
root locked installer with another version fails before installation. The Web
package retains its own install boundary and lockfile.

This decision remains `proposed` until exact-head review and verification are
complete. It does not authorize CI runtime promotion, deployment, shared or
production environment changes, or changes to application and Session identity
semantics.
