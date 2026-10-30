# ADR: Isolate TypeScript environments and aggregate root gates

- Date: 2026-10-31
- Status: proposed

## Context

The repository contains two distinct TypeScript execution environments. The API,
Worker, shared packages, root tests, and Vitest configuration use Node and
NodeNext semantics. The Vue application uses Bundler module resolution, browser
libraries, Vue single-file components, and `vue-tsc`. The previous root program
was a Node-configured mixed program: its broad include absorbed Web `.ts` files
under NodeNext, ES2022-only libraries, and Node/Vitest globals. It therefore
lacked the Web DOM environment and did not understand Vue single-file components
or Bundler resolution. The same configuration also served as the production
emit configuration, causing the root build to emit tests and tool entrypoints
while omitting `.vue` checking and the Vite build.

The root `typecheck` and `build` scripts also checked only the Node TypeScript
program. They therefore did not represent repository-wide gates even though
their names implied that scope.

The Session identity API, data, security, runtime, contract, and test semantics
are frozen for this decision. This record changes only TypeScript program
boundaries and gate composition.

## Options considered

### Keep one TypeScript program

This minimizes configuration files, but mixes Node, DOM, Bundler, and Vue
semantics. It also cannot provide a production-only Node emit without either
emitting tests and tools or relying on fragile command-line overrides.

### Adopt TypeScript project references or npm workspaces

References and workspaces could model a larger monorepo graph, but they would
change install and build boundaries beyond the current need. The repository has
two intentionally independent package/lock/install boundaries and does not yet
need composite project output management.

### Use a shared strictness base with separate programs

This retains common correctness rules while allowing each environment to own
its module resolution, libraries, globals, decorators, and emit behavior. Root
scripts can explicitly compose the independent checks and builds.

## Proposed decision

Introduce `tsconfig.base.json` containing only environment-neutral target and
strictness settings. Use a shared strictness base and three
environment-specific programs:

- root `tsconfig.json` checks API, Worker, shared packages, root tests, and the
  Vitest configuration with NodeNext, ES2022, Node, and Vitest globals;
- `tsconfig.build.json` inherits the root Node program and narrows it to API and
  Worker production source for emission to `dist/`; its only environment
  difference is production-only Node globals without Vitest globals, and it
  sets `rootDir`, `outDir`, and `noEmitOnError` for emission;
- `apps/web/tsconfig.json` checks Vue and Vite sources with ESNext, Bundler,
  DOM, DOM.Iterable, Vue/Vitest/Node types, isolated modules, and no emit.

The root `typecheck` gate runs the Node and Web typechecks in sequence. The root
`build` gate runs the production Node emit and the Web build in sequence. Any
failed subcommand propagates a non-zero exit status. Shared contracts remain
checked under NodeNext through the root program and under Bundler semantics
through their Web imports.

This proposal does not introduce project references, npm workspaces, broad Vue
module declarations, DOM globals in the Node program, or `.js` suffix changes
to Web imports.

## Consequences

Each runtime is checked with its actual resolution and global environment. The
root gate names now reflect repository-wide coverage, while production Node
output excludes tests, Vitest configuration, contract generators/auditors,
lint entrypoints, and migration validation tools.

There are more configuration files and both package installations must be
available before aggregate gates run. The sequential scripts favor explicit
failure behavior and readable logs over build parallelism.

This decision remains `proposed` until the exact implementation head receives
the required review and verification. It does not authorize API, database,
security, contract, deployment, CI, shared-environment, or production changes.

## Failure, rollback, and review conditions

The proposal fails verification if the root typecheck and production build no
longer inherit the same Node environment settings (apart from the build's
production-only `types`), if production emit admits a test or tool entrypoint,
if an API or Worker runtime dependency is omitted, or if an aggregate gate can
report success after either its Node or Web subcommand fails. Verification must
stop rather than relax checks, swallow a non-zero exit, claim a false green, or
temporarily recombine the Node and Web programs.

Before this decision is accepted, a failure leaves it `proposed` (or moves it to
`rejected`) and requires renewed architecture review. Rollback is one complete,
reviewable revert of the toolchain implementation commit together with its
matching root and Web lockfiles; configurations and lockfiles must not be mixed
across revisions. After shared use, prefer a traceable forward-fix when that is
safer than reverting other consumers, otherwise use an explicit revert. This
toolchain-only rollback does not include a database, API, Session, or data
migration rollback.

Re-review this decision whenever configuration inheritance changes, production
entry boundaries change, aggregate gate composition or exit propagation
changes, or the Node, Web, and build programs drift from their documented
environments. Any event that would require dual runtimes, weaker checks, broader
emit, or a changed Node/Web architecture must return to architecture decision
rather than being treated as an implementation exception.
