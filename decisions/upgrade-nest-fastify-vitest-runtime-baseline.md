# ADR: Adopt the coherent Nest, Fastify, and Vitest runtime baseline

- Date: 2026-10-30
- Status: accepted

## Context

The backend foundation needed a coherent runtime baseline before additional
backend verticals could begin. The previous stack used Node 18, Nest 10,
Fastify 4, `@fastify/cookie` 9, and Vitest 2. Keeping those majors would have
required an explicit, time-bounded risk acceptance and would not have provided
the approved runtime baseline for BE-IMP-02.

The approved starting revision is
`110554e0f037e4b49496bedba58f7fbdfa19d1f0`. The upgrade was implemented as a
contiguous, attributable three-commit chain:

- U1 `72a606f807b431a0a4e007785123ed7d307810ba` pins Node `22.22.3` in
  `.nvmrc` and raises the package engine floor;
- U2 `e29eb32563ebf42132157a6a25d2aaf94e164340` upgrades the test chain to
  Vitest `4.1.12` with locked Vite `8.3.5`;
- U3 `3315599f80615ec9f5ce248a23d56f2657706df7` upgrades the production
  runtime as one coherent set and adds focused runtime regression tests.

At U3, `package-lock.json` has SHA-256
`d274e3139baf4b138458690d575e6b92bca4bd2da62f25f004f9bcc5bf0b24ee`.
The upgrade changed only `.nvmrc`, `package.json`, `package-lock.json`, and
`tests/integration/runtime-upgrade.test.ts`. It did not change `apps/**`, the
OpenAPI contract or generated artifacts, live contract inventory or decisions,
database schema or migrations, TypeScript or ESLint, CI, deployment files, or
the existing contract-baseline ADR.

The protected contract identities at U3 are:

- OpenAPI:
  `149e4bbde325ec8ceb4dad3f550af1fa75c2a98dcf8ea882de4f41215b057984`;
- generated types:
  `ae349a7f9f81b712bc0ef276a12ff0127ca40db9e83878b64c47fab5e1b5dc16`;
- generated client:
  `d4b5144d568a460a1b0bae89772fd519eb95ef6747d3cb95fa04e6e810907044`;
- live breaking inventory:
  `88282c07f858d7fb3fe25130ed9c2786774813ab6cf9e411b5f3da6f4387fa2c`;
- live breaking decisions:
  `c775b0a7973b6f57bfb704715165e006e63aaff0f02361f70f7535c563985e59`.

The existing contract ADR explicitly states that contract promotion does not
authorize runtime promotion. This record therefore makes a separate runtime
decision and does not amend or supersede the contract decision.

## Options considered

### Retain the old majors with a risk acceptance

This option minimized immediate code and dependency movement. It was rejected
because it would preserve a stack that had already failed the runtime gate for
later backend verticals, require an expiring risk acceptance, and defer the same
major-version migration into BE-IMP-02 or a later, more coupled change.

### Use an intermediate Nest 11 and Fastify 5 baseline

This option reduced the size of an individual Nest step. It was rejected as the
long-lived baseline because it would create a transitional combination, require
two independent promotion cycles, and duplicate adapter, lifecycle, security,
contract, and database regression work without removing the final Nest 12
migration.

### Adopt the coherent target directly

This option upgrades Node, the test chain, and the production runtime in
separate attributable commits, while aligning the Nest packages and Fastify
adapter in one production-runtime commit. It has a larger controlled migration
surface than retaining the old stack, but avoids a mixed-major or temporary
runtime baseline and provides one exact set for independent review and QA.

## Decision

Adopt the following coherent runtime set as the accepted non-production
technical baseline:

- Node `22.22.3` as the exact validated runtime selected by `.nvmrc`, with the
  package engine floor at `>=22.22.3`;
- `@nestjs/common`, `@nestjs/core`, and `@nestjs/platform-fastify` all pinned
  to `12.3.2`;
- direct Fastify pinned to `5.12.7`;
- `@fastify/cookie` pinned to `10.0.1`;
- Vitest pinned to `4.1.12`, with Vite resolved and locked to `8.3.5`;
- TypeScript, ESLint, and TypeScript-ESLint remain on their existing,
  independently governed track.

The validated install and QA toolchain was Node `22.22.3` with npm `11.6.2`,
using a single `npm ci --ignore-scripts` before database credentials were made
available to test processes. This evidence accepts the exact U3 technical
baseline; it does not close `DEVOPS-RU-001`. Repository-level npm selection and
fail-closed rejection of an incorrect Node or npm remain a separate required
change before JOYHO-14 can complete or BE-IMP-02 can be released.

The accepted runtime behavior includes the independently reviewed lifecycle and
security boundaries already present in `apps/**`: Fastify cookie parsing before
the request-safety/CSRF guard, global RFC 9457 error handling, response
validation, idempotency and transaction boundaries, API and Worker pool
shutdown, and Worker/Outbox processing. U3 does not redefine those behaviors;
the regression suite demonstrates that the coherent dependency set preserves
them.

This decision authorizes only the local, isolated, non-production technical
baseline. It does not by itself:

- complete JOYHO-14;
- release BE-IMP-02 or change any downstream issue state;
- verify or authorize CI runtime promotion, artifact publication, deployment,
  shared or production migration, production secrets, or production traffic;
- establish production rollout, rollback, performance, load, or adversarial
  security evidence;
- authorize a change to OpenAPI, generated clients, supported HTTP behavior,
  database contracts, application security order, or business logic.

Those gates remain owned by their respective reviewers, QA, operators, and the
full-stack delivery Leader.

## Consequences

The project now has one attributable runtime combination for subsequent
verification. Nest core packages and the Fastify adapter cannot drift across
majors, and the runtime/test upgrades remain separable in Git history. The
existing OpenAPI and database baselines remain independently auditable because
they were not changed by this decision.

The exact U3 head passed independent backend architecture review and isolated
QA on PostgreSQL 16.15. The verified results include contract 99/99, migration
5/5, integration 32/32, and the full suite 185/185, all with zero skipped and
zero failures. Full and production dependency audits reported zero
vulnerabilities at the reviewed head. These results support the local
non-production technical promotion only.

The following findings remain open and retain their original severity:

- `DEVOPS-RU-001` — P2: the repository does not yet enforce the selected npm
  version or reject an incorrect toolchain before install. This blocks
  JOYHO-14 completion and BE-IMP-02 release until separately implemented,
  reviewed, and verified on a new exact head.
- `BE-REV-RU-001` — P3, non-blocking: focused runtime tests do not persist all
  `host`/`hostname`/`port`, server-side repeated/semicolon query, and raw-socket
  `FST_ERR_BAD_URL` diagnostics. Independent review found no supported
  consumer regression.
- `DEVOPS-RU-002` — P3, non-blocking: the historical npm 10.8.2 Arborist
  `edgesOut` failure has no verified root cause. A future recurrence requires
  preserving the debug log, exact toolchain, command, lock digest,
  registry/cache configuration, and exit code before any retry or tool change.

CI runtime promotion, artifact storage, deployment, shared or production
migration, real traffic, performance/load testing, adversarial security
testing, and production rollout/rollback remain `NOT VERIFIED`. Their absence
does not invalidate the isolated technical evidence, but it continues to block
deployment, release, and any production-readiness claim.

Before deployment, rollback is not a manifest-only edit. The commits and their
matching lockfiles must be reverted in reverse order, U3 then U2 then U1, and
the selected target commit must be reinstalled and verified with the approved
Node/npm toolchain. Because this upgrade contains no schema or migration
change, that code rollback does not require a database rollback and does not
prove production data rollback. After the branch enters shared review or
downstream use, stop promotion and prefer a traceable forward-fix. Do not
forward-fix by weakening validation, guards, error mapping, dependency
coherence, or install isolation.

## Invalidation and re-review events

This decision and its current review evidence must be re-opened if any of the
following changes:

- a selected Node, npm, Nest, Fastify, cookie, Vitest, Vite, or lockfile
  version or byte identity;
- `apps/**`, including adapter creation, bootstrap/close behavior, global
  filter/guard/interceptor order, cookie/CSRF handling, RFC 9457 mapping,
  response validation, idempotency/transaction semantics, or Worker/Outbox
  behavior;
- OpenAPI, generated types/client, live inventory/decisions, or any supported
  HTTP consumer behavior;
- database schema, migration, transaction ownership, or PostgreSQL runtime
  assumptions;
- the repository toolchain selection or install entrypoint, CI/container/
  deployment entrypoint, Secrets boundary, or install-script policy;
- the reviewed security boundary, production target, or rollback assumptions;
- any P2 is waived, downgraded, or claimed closed without the required exact-
  head implementation, independent review, and QA evidence.

A documentation-only addition of this ADR does not require reinstalling or
rerunning the product suite. Any later implementation change, including the
separate `DEVOPS-RU-001` remediation, creates a new exact head and must satisfy
its own review and QA gates.

## Acceptance evidence

- approved start revision:
  `110554e0f037e4b49496bedba58f7fbdfa19d1f0`;
- final reviewed runtime revision:
  `3315599f80615ec9f5ce248a23d56f2657706df7`;
- backend architecture review PASS:
  comment `01a18c41-7ecf-7441-9161-1b235c75a997`;
- DevOps review CONDITIONAL PASS:
  comment `01a18c47-637c-7e43-ac12-1f8b6baf65fa`;
- exact-head independent QA PASS:
  run `01a18c4a-c044-7de3-86dc-8bc0b53f50c2`, comment
  `01a18c51-0a9d-779f-99bf-87ae570f370f`;
- system architecture review CONDITIONAL PASS:
  comment `01a18c57-60f4-76ca-b40e-22c03a1cc4c2`;
- Leader acceptance of the technical choice and this ADR completion boundary:
  comment `01a18c5b-68d7-7cff-80cd-3ae716d1875c`.

The status is `accepted` because the Leader explicitly accepted the coherent
runtime technical choice and authorized an accepted ADR when this record
satisfied the stated completion definition. Acceptance of this record does not
close `DEVOPS-RU-001`, complete JOYHO-14, release BE-IMP-02, or authorize any
production operation.
