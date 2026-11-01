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
});
