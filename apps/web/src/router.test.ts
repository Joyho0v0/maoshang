import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createMemoryHistory } from 'vue-router';

import { createAppRouter } from './router';

describe('application router', () => {
  it('lazy loads the workspace route and preserves an explicit loading route', async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push('/workspace');
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('workspace');
    expect(router.currentRoute.value.matched[0]?.components?.default).toBeDefined();

    await router.push('/loading');
    expect(router.currentRoute.value.name).toBe('loading');
  });

  it('exposes the customers, catalog and orders vertical-slice routes', async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push('/customers');
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('customers');

    await router.push('/catalog');
    expect(router.currentRoute.value.name).toBe('catalog');

    await router.push('/orders');
    expect(router.currentRoute.value.name).toBe('orders');
  });

  it('guards the local UI harness route to dev and test builds', () => {
    const webRoot = process.cwd().endsWith('/apps/web') ? process.cwd() : join(process.cwd(), 'apps/web');
    const source = readFileSync(join(webRoot, 'src/router.ts'), 'utf8');

    expect(source).toContain("import.meta.env.DEV || import.meta.env.MODE === 'test'");
    expect(source).toContain("path: '/__ui-harness'");
    const boundarySource = readFileSync(join(webRoot, 'scripts/verify-production-boundary.mjs'), 'utf8');
    expect(boundarySource).toContain('UiHarnessPage');
  });
});
