import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  browserHarnessScenarios,
  stateHarnessCases,
  visualViewportPresets,
} from './harness';

describe('shared UI harness', () => {
  it('keeps the required state matrix and viewport fixtures explicit', () => {
    expect(stateHarnessCases.map((item) => item.state)).toEqual([
      'loading',
      'empty',
      'error',
      'forbidden',
      'offline',
    ]);
    expect(visualViewportPresets).toEqual([
      { name: 'narrow', width: 320 },
      { name: 'mobile', width: 390 },
      { name: 'tablet', width: 720 },
      { name: 'zoom-200', width: 640 },
    ]);
    expect(browserHarnessScenarios).toHaveLength(108);
    expect(browserHarnessScenarios.every((scenario) => scenario.requiredSelectors.length > 0)).toBe(true);
    expect(new Set(browserHarnessScenarios.map((scenario) => scenario.path))).toEqual(
      new Set([
        '/workspace', '/customers', '/catalog', '/orders',
        '/customers?fixture=empty-group', '/catalog?fixture=empty-group', '/orders?fixture=empty-group',
        '/customers?fixture=forbidden', '/catalog?fixture=offline', '/orders?fixture=error',
        '/customers/00000000-0000-4000-8000-000000000101',
        '/customers/00000000-0000-4000-8000-000000000101/edit',
        '/catalog/products/00000000-0000-4000-8000-000000000201',
        '/catalog/products/00000000-0000-4000-8000-000000000201/edit',
        '/catalog/skus/00000000-0000-4000-8000-000000000301',
        '/catalog/skus/00000000-0000-4000-8000-000000000301/edit',
        '/orders/00000000-0000-4000-8000-000000000401',
        '/orders/00000000-0000-4000-8000-000000000401/edit',
        '/customers/new', '/catalog/products/new', '/catalog/skus/new', '/orders/new',
        '/customers/00000000-0000-4000-8000-000000000101?fixture=ready&exercise=reject',
        '/loading', '/empty', '/error', '/__ui-harness',
      ]),
    );
  });

  it('uses bounded route readiness and rejects browser wait timeouts', () => {
    const webRoot = process.cwd().endsWith('/apps/web') ? process.cwd() : join(process.cwd(), 'apps/web');
    const source = readFileSync(join(webRoot, 'scripts/chromium-harness.mjs'), 'utf8');

    expect(source).toContain('waitForRouteReady');
    expect(source).toContain('waitForSelectors');
    expect(source).toContain('eventReject(new Error');
    expect(source).not.toContain('await delay(250)');
  });
});
