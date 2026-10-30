import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
  engines?: { node?: string };
  packageManager?: string;
  devEngines?: {
    runtime?: { name?: string; version?: string; onFail?: string };
    packageManager?: { name?: string; version?: string; onFail?: string };
  };
  devDependencies?: { '@types/node'?: string };
};
const nodeVersionPath = resolve(process.cwd(), '.nvmrc');
const nodeVersionFile = existsSync(nodeVersionPath)
  ? readFileSync(nodeVersionPath, 'utf8').trim()
  : undefined;

describe('web toolchain baseline', () => {
  it('declares the approved Node 22 and npm 11 toolchain', () => {
    expect(packageJson.engines?.node).toBe('>=22.22.3');
    expect(packageJson.packageManager).toBe('npm@11.6.2');
    expect(packageJson.devEngines).toEqual({
      runtime: { name: 'node', version: '22.22.3', onFail: 'error' },
      packageManager: { name: 'npm', version: '11.6.2', onFail: 'error' },
    });
  });

  it('pins the local runtime and Node API types to Node 22', () => {
    expect(nodeVersionFile).toBe('22.22.3');
    expect(packageJson.devDependencies?.['@types/node']).toBe('22.10.2');
  });
});
