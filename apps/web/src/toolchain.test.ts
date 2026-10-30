import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
  engines?: { node?: string };
  devDependencies?: { '@types/node'?: string };
};
const nodeVersionPath = resolve(process.cwd(), '.nvmrc');
const nodeVersionFile = existsSync(nodeVersionPath)
  ? readFileSync(nodeVersionPath, 'utf8').trim()
  : undefined;

describe('web toolchain baseline', () => {
  it('declares the approved Node 24 LTS range', () => {
    expect(packageJson.engines?.node).toBe('>=24.0.0 <25.0.0');
  });

  it('pins the local runtime and Node API types to the verified Node 24 patch', () => {
    expect(nodeVersionFile).toBe('24.22.1');
    expect(packageJson.devDependencies?.['@types/node']).toMatch(/^24\./);
  });
});
