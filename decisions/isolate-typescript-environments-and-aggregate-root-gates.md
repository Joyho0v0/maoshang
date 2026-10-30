# ADR: Isolate TypeScript environments and aggregate root gates

- Date: 2026-10-31
- Status: proposed

## Context

The repository contains two distinct TypeScript execution environments. The API,
Worker, shared packages, root tests, and Vitest configuration use Node and
NodeNext semantics. The Vue application uses Bundler module resolution, browser
libraries, Vue single-file components, and `vue-tsc`. A single root program
previously included both environments and also served as the production emit
configuration. That allowed DOM and Node globals to overlap and caused the root
build to emit tests and tool entrypoints.

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
strictness settings. Use three independent programs:

- root `tsconfig.json` checks API, Worker, shared packages, root tests, and the
  Vitest configuration with NodeNext, ES2022, Node, and Vitest globals;
- `tsconfig.build.json` emits only API and Worker production source to `dist/`,
  with `rootDir` set to the repository root and `noEmitOnError` enabled;
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
