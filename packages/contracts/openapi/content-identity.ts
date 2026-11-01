import { createHash } from 'node:crypto';
import { parse as parseYamlDocument } from 'yaml';

export type ReferenceClosurePolicy =
  'all-$ref-and-$dynamicRef-values-are-string-local-fragments';

export type ReferenceClosureResult =
  | 'not-scanned-bytes-differ'
  | 'local-only'
  | 'not-local';

export type ReferenceViolationKind =
  | 'external-reference'
  | 'non-string-reference';

export interface ContentSideEvidence {
  readonly sha256: string;
  readonly byteLength: number;
}

export interface ReferenceClosureEvidence {
  readonly policy: ReferenceClosurePolicy;
  readonly result: ReferenceClosureResult;
  readonly violationKinds: readonly ReferenceViolationKind[];
}

export type ContentIdentityAnalysis =
  | {
      readonly decision: 'content-identity';
      readonly baseline: ContentSideEvidence;
      readonly candidate: ContentSideEvidence;
      readonly bytesEqual: true;
      readonly referenceClosure: ReferenceClosureEvidence & {
        readonly result: 'local-only';
        readonly violationKinds: readonly [];
      };
      readonly shortcutReason: 'identical-bytes-local-reference-closure';
    }
  | {
      readonly decision: 'semantic-comparator';
      readonly baseline: ContentSideEvidence;
      readonly candidate: ContentSideEvidence;
      readonly bytesEqual: boolean;
      readonly referenceClosure: ReferenceClosureEvidence;
      readonly shortcutReason:
        | 'bytes-differ'
        | 'identical-bytes-reference-closure-not-local';
    };

export interface ComparisonEvidence {
  readonly mode: 'content-identity' | 'semantic-comparator';
  readonly comparatorExecuted: boolean;
  readonly baseline: ContentSideEvidence;
  readonly candidate: ContentSideEvidence;
  readonly bytesEqual: boolean;
  readonly referenceClosure: ReferenceClosureEvidence;
  readonly shortcutReason:
    | 'identical-bytes-local-reference-closure'
    | 'bytes-differ'
    | 'identical-bytes-reference-closure-not-local';
}

export interface ContentIdentityOptions {
  readonly sha256?: (content: Buffer) => string;
  readonly parseYaml?: (source: string) => unknown;
}

export type ContentIdentityFailurePhase = 'hash' | 'parse' | 'scan';

export class ContentIdentityError extends Error {
  readonly phase: ContentIdentityFailurePhase;

  constructor(phase: ContentIdentityFailurePhase, message: string, options?: ErrorOptions) {
    super(`ContentIdentityError.phase=${phase}: ${message}`, options);
    this.name = 'ContentIdentityError';
    this.phase = phase;
  }
}

export function analyzeContentIdentity(
  baseline: Buffer,
  candidate: Buffer,
  options: ContentIdentityOptions = {},
): ContentIdentityAnalysis {
  const hash = options.sha256 ?? defaultSha256;
  const parseYaml = options.parseYaml ?? parseYamlDocument;
  const baselineEvidence = digestSide('baseline', baseline, hash);
  const candidateEvidence = digestSide('candidate', candidate, hash);
  const bytesEqual = baseline.equals(candidate);

  if (!bytesEqual) {
    return {
      decision: 'semantic-comparator',
      baseline: baselineEvidence,
      candidate: candidateEvidence,
      bytesEqual,
      referenceClosure: {
        policy: 'all-$ref-and-$dynamicRef-values-are-string-local-fragments',
        result: 'not-scanned-bytes-differ',
        violationKinds: [],
      },
      shortcutReason: 'bytes-differ',
    };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(baseline.toString('utf8'));
  } catch (error) {
    throw new ContentIdentityError('parse', errorMessage(error), { cause: error });
  }

  let violationKinds: ReferenceViolationKind[];
  try {
    violationKinds = scanReferenceClosure(parsed);
  } catch (error) {
    if (error instanceof ContentIdentityError && error.phase === 'scan') throw error;
    throw new ContentIdentityError('scan', errorMessage(error), { cause: error });
  }

  const referenceClosure = {
    policy: 'all-$ref-and-$dynamicRef-values-are-string-local-fragments' as const,
    result: violationKinds.length === 0 ? 'local-only' as const : 'not-local' as const,
    violationKinds: violationKinds as readonly ReferenceViolationKind[],
  };
  if (violationKinds.length > 0) {
    return {
      decision: 'semantic-comparator',
      baseline: baselineEvidence,
      candidate: candidateEvidence,
      bytesEqual: true,
      referenceClosure,
      shortcutReason: 'identical-bytes-reference-closure-not-local',
    };
  }

  return {
    decision: 'content-identity',
    baseline: baselineEvidence,
    candidate: candidateEvidence,
    bytesEqual: true,
    referenceClosure: {
      policy: referenceClosure.policy,
      result: 'local-only',
      violationKinds: [],
    },
    shortcutReason: 'identical-bytes-local-reference-closure',
  };
}

export function finalizeComparisonEvidence(
  analysis: ContentIdentityAnalysis,
  comparatorExecuted: boolean,
): ComparisonEvidence {
  const expectedComparatorExecution = analysis.decision === 'semantic-comparator';
  if (comparatorExecuted !== expectedComparatorExecution) {
    throw new Error(
      `comparison evidence comparatorExecuted=${String(comparatorExecuted)} does not match decision=${analysis.decision}`,
    );
  }
  return {
    mode: analysis.decision,
    comparatorExecuted,
    baseline: analysis.baseline,
    candidate: analysis.candidate,
    bytesEqual: analysis.bytesEqual,
    referenceClosure: analysis.referenceClosure,
    shortcutReason: analysis.shortcutReason,
  };
}

function defaultSha256(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function digestSide(
  side: 'baseline' | 'candidate',
  content: Buffer,
  hash: (content: Buffer) => string,
): ContentSideEvidence {
  try {
    const sha256 = hash(content);
    if (!/^[0-9a-f]{64}$/.test(sha256)) {
      throw new Error(`${side} SHA-256 result is not a lowercase 64-character hexadecimal digest.`);
    }
    return { sha256, byteLength: content.length };
  } catch (error) {
    if (error instanceof ContentIdentityError && error.phase === 'hash') throw error;
    throw new ContentIdentityError('hash', errorMessage(error), { cause: error });
  }
}

function scanReferenceClosure(root: unknown): ReferenceViolationKind[] {
  const violations = new Set<ReferenceViolationKind>();
  const seen = new WeakSet<object>();
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const value = stack.pop();
    if (typeof value !== 'object' || value === null) continue;
    if (seen.has(value)) continue;
    seen.add(value);

    const object = value as Record<string, unknown>;
    for (const referenceKey of ['$ref', '$dynamicRef'] as const) {
      if (!Object.prototype.hasOwnProperty.call(object, referenceKey)) continue;
      classifyReference(object[referenceKey], violations);
    }

    const keys = Object.keys(object).sort();
    for (const key of keys) stack.push(object[key]);
  }

  return (['external-reference', 'non-string-reference'] as const)
    .filter((kind) => violations.has(kind));
}

function classifyReference(value: unknown, violations: Set<ReferenceViolationKind>): void {
  if (typeof value !== 'string') {
    violations.add('non-string-reference');
  } else if (!value.startsWith('#')) {
    violations.add('external-reference');
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
