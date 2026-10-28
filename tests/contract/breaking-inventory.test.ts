import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { expect, it } from 'vitest';
import inventory from '../../packages/contracts/openapi/breaking-inventory.json' with { type: 'json' };
import { collectBreakingInventory } from '../../packages/contracts/openapi/breaking-inventory.js';

const baselinePath = new URL('../../packages/contracts/openapi/openapi.baseline.yaml', import.meta.url);
const candidatePath = new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url);

it('keeps the complete breaking inventory auditable and synchronized with both artifacts', async () => {
  const baseline = parse(await readFile(baselinePath, 'utf8')) as Record<string, unknown>;
  const candidate = parse(await readFile(candidatePath, 'utf8')) as Record<string, unknown>;
  const generated = await collectBreakingInventory(baseline, candidate);
  const persisted = inventory as typeof generated;

  expect(persisted.count).toBeGreaterThan(84);
  expect(persisted.entries).toHaveLength(persisted.count);
  expect((inventory as { baseline: { digest: string } }).baseline.digest).toBe('9fb299cb04ade8674e2819fb00768b6689a44bebc297175bb52b1eba39b29c25');
  expect((inventory as { candidate: { revision: string; sha256: string; generatedSha256: string; generatedClientSha256: string } }).candidate).toEqual({
    revision: '9138ea8f5cf130c3664367e39cafc18812edaa55',
    sha256: 'ed189686794ceae08890d3aa264c099c5239bd6d7ee8b5b0d401556c9257b287',
    generatedSha256: 'b0be58f74d9118664e24d7df68c547235abdb3348fbbf894c6f4d7962c7a0831',
    generatedClientSha256: 'c32e0e08f80a96ca893882d70ad13fd3a96c134fa97bef8a6346e383f0b527ab',
    path: 'packages/contracts/openapi/openapi.yaml',
  });
  expect(new Set(persisted.entries.map((entry) => entry.jsonPath)).size).toBe(persisted.count);
  for (const pathPrefix of [
    'root.paths./auth/sessions.post.responses.403',
    'root.paths./users/{id}.get.responses.200.content.application/json.schema.href',
    'root.paths./users/{id}.get.responses.404',
    'root.paths./organizations/{id}/users.post.responses.202',
  ]) {
    expect(persisted.entries.some((entry) => entry.jsonPath.startsWith(pathPrefix)), pathPrefix).toBe(true);
  }
  expect(persisted.entries.every((entry) => entry.reason.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.ownership.decisionOwner.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.disposition.status.length > 0 && entry.disposition.action.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.authorization.requiredApprovers.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.verification.evidence.length > 0)).toBe(true);
  expect(persisted.entries.every((entry) => entry.verification.affectedPaths.length > 0)).toBe(true);

  expect(generated.entries).toEqual(persisted.entries);
});
