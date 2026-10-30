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
