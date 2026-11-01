import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';
import { parse } from 'yaml';

const root = resolve(new URL('../..', import.meta.url).pathname);
const formal = resolve(root, 'packages/contracts/openapi/v2');
const review = resolve(root, 'docs/review-only/be-imp-04-v2');

const approvedOpenApiSha = '48028d048352d97266b8974c9f21279ea02b79ea1c9a1f3877d823ca23a445b6';
const approvedTypesSha = 'f1e4b47b471607a41f5823a5d4004c337a7e2e6dacd819b2f3a7edaa25699888';
const approvedClientSha = '22222f9dda47e73fc380df0bd94bd79c867c915a289fa2c047c5f3dfcc04064c';

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

async function mustRead(path: string): Promise<Buffer> {
  return readFile(path);
}

describe('formal Catalog + Orders v2 promotion', () => {
  it('promotes the reviewed artifact byte-for-byte without touching v1', async () => {
    const v2 = await mustRead(resolve(formal, 'openapi.yaml'));
    expect(sha256(v2)).toBe(approvedOpenApiSha);
    expect(v2.equals(await mustRead(resolve(formal, 'openapi.baseline.yaml')))).toBe(true);
    expect(v2.equals(await mustRead(resolve(review, 'openapi.yaml')))).toBe(true);

    const manifest = JSON.parse(await (await mustRead(resolve(formal, 'manifest.json'))).toString('utf8')) as { status: string; basePath: string; openapiSha256: string; generatedTypesSha256: string; generatedClientSha256: string };
    expect(manifest).toMatchObject({ status: 'FROZEN', basePath: '/api/v2', openapiSha256: approvedOpenApiSha, generatedTypesSha256: approvedTypesSha, generatedClientSha256: approvedClientSha });

    const v1OpenApi = sha256(await mustRead(resolve(root, 'packages/contracts/openapi/openapi.yaml')));
    const v1Types = sha256(await mustRead(resolve(root, 'packages/contracts/openapi/generated.ts')));
    const v1Client = sha256(await mustRead(resolve(root, 'packages/contracts/openapi/generated-client.ts')));
    expect(v1OpenApi).toBe('a3e5168ac3346ac72d3d06aa9d67b4c52f893398c64ed80da71973e923be843c');
    expect(v1Types).toBe('0cf5340ae26aecfd24d0f7a1ce433ccd2450c9c65f1183dd5b19ea9d910d4821');
    expect(v1Client).toBe('b4a017cef65a11018f70321f624e3456708d55fdea638b9683a57fb610b5712c');
  });

  it('is independently parseable, generated, and free of v1 imports', async () => {
    const source = parse((await mustRead(resolve(formal, 'openapi.yaml'))).toString('utf8')) as Record<string, unknown>;
    await expect(SwaggerParser.dereference(source as never)).resolves.toBeTruthy();
    const generated = await Promise.all(['types.ts', 'client.ts', 'runtime-validator.ts', 'client.mjs', 'runtime-validator.mjs'].map((name) => mustRead(resolve(formal, name))));
    expect(generated.every((value) => !value.toString('utf8').includes('packages/contracts/openapi/'))).toBe(true);
    expect(generated[0]!.toString('utf8')).toContain('export interface paths');
    expect(generated[1]!.toString('utf8')).toContain('GeneratedV2Client');
    expect(generated[2]!.toString('utf8')).toContain('createV2RuntimeValidator');
  });

  it('ships additive 005/006 migrations and no legacy backfill engine', async () => {
    const migrationNames = ['005_catalog_orders_v2_expand.sql', '006_catalog_orders_v2_dual_version.sql'];
    for (const name of migrationNames) await access(resolve(root, 'packages/database/migrations', name), constants.R_OK);
    const migrationText = (await Promise.all(migrationNames.map((name) => mustRead(resolve(root, 'packages/database/migrations', name))))).map((value) => value.toString('utf8')).join('\n');
    expect(migrationText).not.toMatch(/backfill_(run|manifest|item)|policy_fact_evidence|v2_backfill/i);
    expect(migrationText).toContain('NOT VALID');
    expect(migrationText).toContain('organization_id');
  });
});
