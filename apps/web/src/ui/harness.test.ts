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
    expect(browserHarnessScenarios).toHaveLength(20);
    expect(browserHarnessScenarios.every((scenario) => scenario.requiredSelectors.length > 0)).toBe(true);
    expect(new Set(browserHarnessScenarios.map((scenario) => scenario.path))).toEqual(
      new Set(['/workspace', '/loading', '/empty', '/error', '/__ui-harness']),
    );
  });
});
