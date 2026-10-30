export const stateHarnessCases = [
  { state: 'loading', heading: '加载中' },
  { state: 'empty', heading: '暂无数据' },
  { state: 'error', heading: '加载失败' },
  { state: 'forbidden', heading: '无权访问' },
  { state: 'offline', heading: '网络不可用' },
] as const;

export const visualViewportPresets = [
  { name: 'narrow', width: 320 },
  { name: 'mobile', width: 390 },
  { name: 'tablet', width: 720 },
  // 1280px CSS viewport at 200% zoom has a 640px effective layout width.
  { name: 'zoom-200', width: 640 },
] as const;

export interface BrowserHarnessScenario {
  readonly path: string;
  readonly width: number;
  readonly zoom: number;
  readonly requiredSelectors: readonly string[];
}

const browserRoutes = [
  { path: '/workspace', requiredSelectors: ['main', 'h1', '.state-panel'] },
  { path: '/loading', requiredSelectors: ['main', '[role="status"]', 'h1'] },
  { path: '/empty', requiredSelectors: ['main', '[role="status"]', 'h1'] },
  { path: '/error', requiredSelectors: ['main', '[role="alert"]', 'button'] },
  {
    path: '/__ui-harness',
    requiredSelectors: [
      'main',
      '[data-testid="open-dialog"]',
      '[data-testid="open-drawer"]',
      '[data-testid="submit-form"]',
    ],
  },
] as const;

export const browserHarnessScenarios: readonly BrowserHarnessScenario[] =
  browserRoutes.flatMap((route) => visualViewportPresets.map((viewport) => ({
    path: route.path,
    width: viewport.width,
    zoom: viewport.name === 'zoom-200' ? 2 : 1,
    requiredSelectors: route.requiredSelectors,
  })));
