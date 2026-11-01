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
  { path: '/customers', requiredSelectors: ['main', 'h1', 'table', '[data-testid="scope-notice"]'] },
  { path: '/catalog', requiredSelectors: ['main', 'h1', 'table', '[data-testid="scope-notice"]'] },
  { path: '/orders', requiredSelectors: ['main', 'h1', 'table', '[data-testid="scope-notice"]'] },
  { path: '/customers?fixture=empty-group', requiredSelectors: ['main', 'h1', '.table-state', '[data-testid="scope-notice"]'] },
  { path: '/catalog?fixture=empty-group', requiredSelectors: ['main', 'h1', '.table-state', '[data-testid="scope-notice"]'] },
  { path: '/orders?fixture=empty-group', requiredSelectors: ['main', 'h1', '.table-state', '[data-testid="scope-notice"]'] },
  { path: '/customers?fixture=forbidden', requiredSelectors: ['main', 'h1', '.state-panel--forbidden'] },
  { path: '/catalog?fixture=offline', requiredSelectors: ['main', 'h1', '.state-panel--offline'] },
  { path: '/orders?fixture=error', requiredSelectors: ['main', 'h1', '.state-panel--error'] },
  { path: '/customers/00000000-0000-4000-8000-000000000101', requiredSelectors: ['main', 'h1', '[data-testid="customer-approve"]'] },
  { path: '/customers/00000000-0000-4000-8000-000000000101/edit', requiredSelectors: ['main', 'h1', 'form', '#customer-name'] },
  { path: '/catalog/products/00000000-0000-4000-8000-000000000201', requiredSelectors: ['main', 'h1', '.detail-card'] },
  { path: '/catalog/products/00000000-0000-4000-8000-000000000201/edit', requiredSelectors: ['main', 'h1', 'form', '#catalog-name'] },
  { path: '/catalog/skus/00000000-0000-4000-8000-000000000301', requiredSelectors: ['main', 'h1', '.detail-card'] },
  { path: '/catalog/skus/00000000-0000-4000-8000-000000000301/edit', requiredSelectors: ['main', 'h1', 'form', '#catalog-name'] },
  { path: '/orders/00000000-0000-4000-8000-000000000401', requiredSelectors: ['main', 'h1', '[data-testid="order-transition-CONFIRM"]'] },
  { path: '/orders/00000000-0000-4000-8000-000000000401/edit', requiredSelectors: ['main', 'h1', 'form', '#order-no'] },
  { path: '/customers/new', requiredSelectors: ['main', 'h1', 'form', '#customer-name'] },
  { path: '/catalog/products/new', requiredSelectors: ['main', 'h1', 'form', '#catalog-name'] },
  { path: '/catalog/skus/new', requiredSelectors: ['main', 'h1', 'form', '#catalog-product'] },
  { path: '/orders/new', requiredSelectors: ['main', 'h1', 'form', '#order-no'] },
  { path: '/customers/00000000-0000-4000-8000-000000000101?fixture=ready&exercise=reject', requiredSelectors: ['main', 'h1', '[data-testid="customer-reject"]'] },
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
      '[data-testid="capability-action"]',
      '[data-testid="capability-attempts"]',
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
