/* global Buffer, WebSocket, clearTimeout, console, fetch, process, setTimeout */

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173';
const screenshotDirectory = process.env.AUTOFLOW_HARNESS_SCREENSHOTS;
const chromePath = process.env.CHROMIUM_PATH ?? '/usr/bin/google-chrome';
const scenarios = [
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
  { path: '/customers/new', requiredSelectors: ['main', 'h1', 'form', '#customer-name'], interaction: 'form' },
  { path: '/catalog/products/new', requiredSelectors: ['main', 'h1', 'form', '#catalog-name'], interaction: 'form' },
  { path: '/catalog/skus/new', requiredSelectors: ['main', 'h1', 'form', '#catalog-product'], interaction: 'form' },
  { path: '/orders/new', requiredSelectors: ['main', 'h1', 'form', '#order-no'], interaction: 'form' },
  { path: '/catalog/skus/new?fixture=reference-pages', requiredSelectors: ['main', 'h1', 'form', '#catalog-product'], interaction: 'catalog-reference-pagination' },
  { path: '/orders/new?fixture=reference-pages', requiredSelectors: ['main', 'h1', 'form', '#order-customer', '#order-sku'], interaction: 'order-reference-pagination' },
  { path: '/catalog/skus/new?fixture=offline', requiredSelectors: ['main', 'form', '#catalog-product', '[data-testid="catalog-product-reference-state"] .state-panel--offline'], interaction: 'reference-blocked' },
  { path: '/orders/new?fixture=forbidden', requiredSelectors: ['main', 'form', '#order-customer', '#order-sku', '[data-testid="order-customers-reference-state"] .state-panel--forbidden', '[data-testid="order-skus-reference-state"] .state-panel--forbidden'], interaction: 'reference-blocked' },
  { path: '/customers/00000000-0000-4000-8000-000000000101?fixture=ready&exercise=reject', requiredSelectors: ['main', 'h1', '[data-testid="customer-reject"]'], interaction: 'customer-reject' },
  { path: '/loading', requiredSelectors: ['main', '[role="status"]', 'h1'] },
  { path: '/empty', requiredSelectors: ['main', '[role="status"]', 'h1'] },
  { path: '/error', requiredSelectors: ['main', '[role="alert"]', 'button'] },
  {
    path: '/__ui-harness',
    requiredSelectors: ['main', '[data-testid="open-dialog"]', '[data-testid="open-drawer"]', '[data-testid="submit-form"]'],
  },
];
const viewports = [
  { name: 'narrow', width: 320, zoom: 1 },
  { name: 'mobile', width: 390, zoom: 1 },
  { name: 'tablet', width: 720, zoom: 1 },
  { name: 'zoom-200', width: 640, zoom: 2 },
];

const userDataDirectory = await mkdtemp(join(tmpdir(), 'autoflow-chromium-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDirectory}`,
  'about:blank',
], { stdio: 'ignore' });

let socket;
try {
  const [debugPort] = (await waitForFile(join(userDataDirectory, 'DevToolsActivePort'))).trim().split('\n');
  const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) throw new Error('Chromium page target was not available.');

  socket = await connect(target.webSocketDebuggerUrl);
  const errors = { console: [], page: [], network: [] };
  const pendingRequests = new Set();
  socket.onEvent = (message) => {
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(message.params.type)) {
      errors.console.push(message.params.type);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.page.push(message.params.exceptionDetails?.text ?? 'exception');
    if (message.method === 'Network.loadingFailed') errors.network.push(message.params.errorText ?? 'network failure');
    if (message.method === 'Network.requestWillBeSent') pendingRequests.add(message.params.requestId);
    if (message.method === 'Network.loadingFinished' || message.method === 'Network.loadingFailed') {
      pendingRequests.delete(message.params.requestId);
    }
    if (message.method === 'Fetch.requestPaused') void handleRequest(socket, message.params);
  };

  await socket.command('Runtime.enable');
  await socket.command('Log.enable');
  await socket.command('Network.enable');
  await socket.command('Page.enable');
  await socket.command('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/v1/*', requestStage: 'Request' }] });

  const results = [];
  for (const scenario of scenarios.flatMap((route) => viewports.map((viewport) => ({ ...route, ...viewport })))) {
    const context = `${scenario.path}@${scenario.name}`;
    await socket.command('Emulation.setDeviceMetricsOverride', {
      width: scenario.width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await socket.command('Emulation.setPageScaleFactor', { pageScaleFactor: scenario.zoom });
    const loaded = socket.waitForEvent('Page.loadEventFired', context);
    await socket.command('Page.navigate', { url: `${baseUrl}${scenario.path}` });
    await loaded;
    await waitForRouteReady(socket, scenario, pendingRequests);
    const inspection = await evaluate(socket, `(() => {
      const required = ${JSON.stringify(scenario.requiredSelectors)};
      const missing = required.filter((selector) => document.querySelector(selector) === null);
      const clientWidth = document.documentElement.clientWidth;
      const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      return {
        missing,
        horizontalOverflow: scrollWidth > clientWidth + 1,
        layout: { clientWidth, scrollWidth },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
    })()`);
    if (scenario.path === '/__ui-harness') {
      inspection.interactions = await exerciseHarness(socket, context);
    } else if (scenario.interaction === 'form') {
      inspection.interactions = await exerciseBusinessForm(socket, context);
    } else if (scenario.interaction === 'customer-reject') {
      inspection.interactions = await exerciseCustomerReject(socket, context);
    } else if (scenario.interaction === 'catalog-reference-pagination') {
      inspection.interactions = await exerciseCatalogReferencePagination(socket, context);
    } else if (scenario.interaction === 'order-reference-pagination') {
      inspection.interactions = await exerciseOrderReferencePagination(socket, context);
    } else if (scenario.interaction === 'reference-blocked') {
      inspection.interactions = await exerciseBlockedReferenceState(socket, context);
    }
    const postInteractionLayout = await evaluate(socket, `(() => {
      const clientWidth = document.documentElement.clientWidth;
      const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      return { clientWidth, scrollWidth, horizontalOverflow: scrollWidth > clientWidth + 1 };
    })()`);
    inspection.horizontalOverflowBeforeInteraction = inspection.horizontalOverflow;
    inspection.horizontalOverflowAfterInteraction = postInteractionLayout.horizontalOverflow;
    inspection.horizontalOverflow = inspection.horizontalOverflow || postInteractionLayout.horizontalOverflow;
    inspection.layoutAfterInteraction = postInteractionLayout;
    if (screenshotDirectory) {
      const screenshot = await socket.command('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(screenshotDirectory, `${scenario.path.slice(1).replaceAll('/', '-')}-${scenario.name}.png`), Buffer.from(screenshot.result.data, 'base64'));
    }
    results.push({ path: scenario.path, viewport: scenario.name, ...inspection });
  }

  const failures = results.filter((result) => result.missing.length > 0 || result.horizontalOverflow || result.interactions?.some((item) => !item.pass));
  const summary = {
    scenarios: results.length,
    failures: failures.length,
    consoleErrors: errors.console,
    pageErrors: errors.page,
    networkErrors: errors.network,
    results,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (failures.length > 0 || errors.console.length > 0 || errors.page.length > 0 || errors.network.length > 0) process.exitCode = 1;
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 2_000);
      chrome.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      chrome.kill('SIGTERM');
    });
  }
  await rm(userDataDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

async function handleRequest(cdp, params) {
  const url = params.request.url;
  if (url.endsWith('/api/v1/auth/csrf')) {
    await cdp.command('Fetch.fulfillRequest', {
      requestId: params.requestId,
      responseCode: 200,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Request-ID', value: '00000000-0000-4000-8000-000000000001' },
        { name: 'Cache-Control', value: 'no-store' },
      ],
      body: Buffer.from(JSON.stringify({ csrfToken: 'c'.repeat(32), expiresAt: '2030-01-01T00:00:00.000Z' })).toString('base64'),
    });
    return;
  }
  if (url.endsWith('/api/v1/auth/sessions/current')) {
    await cdp.command('Fetch.fulfillRequest', {
      requestId: params.requestId,
      responseCode: 401,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/problem+json' },
        { name: 'X-Request-ID', value: '00000000-0000-4000-8000-000000000002' },
      ],
      body: Buffer.from(JSON.stringify({
        type: 'urn:autoflow:problem:unauthorized',
        title: '未登录',
        status: 401,
        code: 'UNAUTHORIZED',
        requestId: '00000000-0000-4000-8000-000000000002',
        retryable: false,
      })).toString('base64'),
    });
    return;
  }
  await cdp.command('Fetch.continueRequest', { requestId: params.requestId });
}

async function exerciseHarness(cdp, context) {
  const interactions = [];
  await evaluate(cdp, `document.querySelector('[data-testid="open-dialog"]')?.click()`);
  await waitForSelectors(cdp, ['[role="dialog"]'], context);
  interactions.push(await evaluate(cdp, `(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return { pass: dialog?.getAttribute('aria-labelledby') === dialog?.querySelector('h2')?.id
      && document.activeElement?.getAttribute('aria-label') === '关闭', name: 'dialog focus and labelledby' };
  })()`));
  await evaluate(cdp, `document.querySelector('[role="dialog"] button[aria-label="关闭"]')?.click()`);
  await waitForAbsent(cdp, '[role="dialog"]', context);
  await evaluate(cdp, `document.querySelector('[data-testid="open-drawer"]')?.click()`);
  await waitForSelectors(cdp, ['[role="dialog"]'], context);
  interactions.push(await evaluate(cdp, `(() => {
    const drawer = document.querySelector('[role="dialog"]');
    return { pass: drawer?.getAttribute('aria-labelledby') === drawer?.querySelector('h2')?.id
      && document.activeElement?.getAttribute('aria-label') === '关闭', name: 'drawer focus and labelledby' };
  })()`));
  await evaluate(cdp, `document.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await waitForAbsent(cdp, '[role="dialog"]', context);
  await evaluate(cdp, `document.querySelector('[data-testid="submit-form"]')?.click()`);
  await waitForSelectors(cdp, ['[role="alert"]', '#customer-name'], context);
  interactions.push(await evaluate(cdp, `(() => {
    const summary = document.querySelector('[role="alert"]');
    const field = document.querySelector('#customer-name');
    const errorLink = summary?.querySelector('a');
    return { pass: document.activeElement === summary
      && field?.getAttribute('aria-describedby') === 'customer-name-error'
      && errorLink?.getAttribute('href') === '#customer-name', name: 'form error focus and association' };
  })()`));
  interactions.push(await evaluate(cdp, `(() => {
    const action = document.querySelector('[data-testid="capability-action"]');
    const describedBy = action?.getAttribute('aria-describedby');
    const reason = describedBy === null ? null : document.getElementById(describedBy);
    const attempts = document.querySelector('[data-testid="capability-attempts"]');
    const before = attempts?.textContent;
    action?.focus();
    action?.click();
    return {
      pass: action instanceof HTMLButtonElement
        && action.disabled
        && document.activeElement !== action
        && action.closest('[inert]') === null
        && reason?.textContent?.includes('当前身份不能编辑客户') === true
        && attempts?.textContent === before,
      name: 'capability disabled action and accessible reason',
    };
  })()`));
  return interactions;
}

async function exerciseBusinessForm(cdp, context) {
  await evaluate(cdp, `document.querySelector('form button[type="submit"]')?.click()`);
  await waitForSelectors(cdp, ['[role="alert"]'], context);
  return [await evaluate(cdp, `(() => {
    const summary = document.querySelector('[role="alert"]');
    const firstInvalid = document.querySelector('input[aria-invalid="true"], textarea[aria-invalid="true"]');
    const describedBy = firstInvalid?.getAttribute('aria-describedby');
    return {
      pass: document.activeElement === summary
        && firstInvalid !== null
        && describedBy !== null
        && document.getElementById(describedBy) !== null,
      name: 'business form error focus and association',
    };
  })()` )];
}

async function exerciseCustomerReject(cdp, context) {
  await evaluate(cdp, `document.querySelector('[data-testid="customer-reject"]')?.click()`);
  await waitForSelectors(cdp, ['[role="dialog"]', '#customer-reject-reason'], context);
  await evaluate(cdp, `document.querySelector('button[form="customer-command-form"]')?.click()`);
  await waitForSelectors(cdp, ['#customer-reject-reason-error'], context);
  return [await evaluate(cdp, `(() => {
    const field = document.querySelector('#customer-reject-reason');
    return {
      pass: field?.getAttribute('aria-invalid') === 'true'
        && field?.getAttribute('aria-describedby') === 'customer-reject-reason-error',
      name: 'customer reject reason validation',
    };
  })()` )];
}

async function exerciseCatalogReferencePagination(cdp, context) {
  await waitForSelectors(cdp, ['[data-testid="catalog-products-load-more"]', '#catalog-product option:nth-child(21)'], context);
  const initial = await evaluate(cdp, `(() => {
    const controls = document.querySelectorAll('#catalog-product');
    return {
      pass: controls.length === 1
        && controls[0] instanceof HTMLSelectElement
        && document.querySelector('input[name="productId"]') === null,
      name: 'catalog create has one Product select before pagination',
    };
  })()`);
  await evaluate(cdp, `document.querySelector('[data-testid="catalog-products-load-more"]')?.click()`);
  await waitForSelectors(cdp, ['#catalog-product option:nth-child(22)'], context);
  return [initial, await evaluate(cdp, `(() => {
    const select = document.querySelector('#catalog-product');
    const controls = document.querySelectorAll('#catalog-product');
    const submit = document.querySelector('form button[type="submit"]');
    if (!(select instanceof HTMLSelectElement)) return { pass: false, name: 'catalog reference pagination and selection' };
    const last = select.options[select.options.length - 1];
    select.value = last?.value ?? '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      pass: controls.length === 1
        && select.options.length === 22
        && select.value === last?.value
        && document.querySelector('input[name="productId"]') === null
        && submit instanceof HTMLButtonElement
        && !submit.disabled,
      name: 'catalog reference pagination and selection',
    };
  })()` )];
}

async function exerciseOrderReferencePagination(cdp, context) {
  await waitForSelectors(cdp, [
    '[data-testid="order-customers-load-more"]',
    '[data-testid="order-skus-load-more"]',
    '#order-customer option:nth-child(21)',
    '#order-sku option:nth-child(21)',
  ], context);
  await evaluate(cdp, `document.querySelector('[data-testid="order-customers-load-more"]')?.click(); document.querySelector('[data-testid="order-skus-load-more"]')?.click()`);
  await waitForSelectors(cdp, ['#order-customer option:nth-child(22)', '#order-sku option:nth-child(22)'], context);
  return [await evaluate(cdp, `(() => {
    const customer = document.querySelector('#order-customer');
    const sku = document.querySelector('#order-sku');
    const submit = document.querySelector('form button[type="submit"]');
    if (!(customer instanceof HTMLSelectElement) || !(sku instanceof HTMLSelectElement)) return { pass: false, name: 'order reference pagination and selection' };
    const customerLast = customer.options[customer.options.length - 1];
    const skuLast = sku.options[sku.options.length - 1];
    customer.value = customerLast?.value ?? '';
    sku.value = skuLast?.value ?? '';
    customer.dispatchEvent(new Event('change', { bubbles: true }));
    sku.dispatchEvent(new Event('change', { bubbles: true }));
    for (const [selector, value] of [['#order-no', 'SO-REFERENCE-21'], ['#order-quantity', '1'], ['#order-unit-price', '10.00']]) {
      const field = document.querySelector(selector);
      if (field instanceof HTMLInputElement) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    return {
      pass: customer.options.length > 21
        && sku.options.length > 21
        && customer.value === customerLast?.value
        && sku.value === skuLast?.value
        && submit instanceof HTMLButtonElement
        && !submit.disabled,
      name: 'order reference pagination and selection',
    };
  })()` )];
}

async function exerciseBlockedReferenceState(cdp) {
  return [await evaluate(cdp, `(() => {
    const submit = document.querySelector('form button[type="submit"]');
    const panels = document.querySelectorAll('[data-testid$="reference-state"] .state-panel');
    return {
      pass: submit instanceof HTMLButtonElement && submit.disabled && panels.length > 0,
      name: 'reference dependency state blocks submit',
    };
  })()` )];
}

async function waitForRouteReady(cdp, scenario, pendingRequests) {
  const context = `${scenario.path}@${scenario.name}`;
  const deadline = Date.now() + 10_000;
  let lastMissing = [...scenario.requiredSelectors];
  while (Date.now() < deadline) {
    const state = await evaluate(cdp, `(() => {
      const required = ${JSON.stringify(scenario.requiredSelectors)};
      return {
        readyState: document.readyState,
        missing: required.filter((selector) => document.querySelector(selector) === null),
      };
    })()`);
    lastMissing = state?.missing ?? lastMissing;
    if (state?.readyState === 'complete' && lastMissing.length === 0 && pendingRequests.size === 0) {
      const stable = await evaluate(cdp, `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve({
        readyState: document.readyState,
        missing: ${JSON.stringify(scenario.requiredSelectors)}.filter((selector) => document.querySelector(selector) === null),
      }))))`);
      if (stable?.readyState === 'complete' && stable.missing.length === 0 && pendingRequests.size === 0) return;
      lastMissing = stable?.missing ?? lastMissing;
    }
    await delay(25);
  }
  throw new Error(`Route ready timeout for ${context}; missing selectors: ${lastMissing.join(', ') || 'none'}; pending requests: ${pendingRequests.size}`);
}

async function waitForSelectors(cdp, selectors, context) {
  const deadline = Date.now() + 5_000;
  let lastMissing = [...selectors];
  while (Date.now() < deadline) {
    const missing = await evaluate(cdp, `(() => ${JSON.stringify(selectors)}.filter((selector) => document.querySelector(selector) === null))()`);
    lastMissing = missing ?? lastMissing;
    if (lastMissing.length === 0) return;
    await delay(25);
  }
  throw new Error(`Selector wait timeout for ${context}; missing selectors: ${lastMissing.join(', ')}`);
}

async function waitForAbsent(cdp, selector, context) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const present = await evaluate(cdp, `document.querySelector(${JSON.stringify(selector)}) !== null`);
    if (!present) return;
    await delay(25);
  }
  throw new Error(`Selector absence timeout for ${context}; selector still present: ${selector}`);
}

async function evaluate(cdp, expression) {
  const result = await cdp.command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result.result.value;
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const eventWaiters = new Map();
    let nextId = 0;
    ws.addEventListener('open', () => resolve({
      command(method, params = {}) {
        const id = ++nextId;
        return new Promise((commandResolve, commandReject) => {
          const timer = setTimeout(() => {
            pending.delete(id);
            commandReject(new Error(`Timed out waiting for ${method}`));
          }, 10_000);
          pending.set(id, { commandResolve, commandReject, timer });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      waitForEvent(method, context) {
        return new Promise((eventResolve, eventReject) => {
          const list = eventWaiters.get(method) ?? [];
          const waiter = { eventResolve, eventReject };
          list.push(waiter);
          eventWaiters.set(method, list);
          waiter.timer = setTimeout(() => {
            const current = eventWaiters.get(method) ?? [];
            eventWaiters.set(method, current.filter((item) => item !== waiter));
            eventReject(new Error(`Timed out waiting for ${method} (${context})`));
          }, 10_000);
        });
      },
      close() { ws.close(); },
      set onEvent(listener) { ws.onEvent = listener; },
    }));
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== undefined) {
        const request = pending.get(message.id);
        if (!request) return;
        clearTimeout(request.timer);
        pending.delete(message.id);
        if (message.error) request.commandReject(new Error(message.error.message));
        else request.commandResolve(message);
        return;
      }
      const waiters = eventWaiters.get(message.method);
      if (waiters) {
        eventWaiters.delete(message.method);
        for (const waiter of waiters) {
          clearTimeout(waiter.timer);
          waiter.eventResolve(message);
        }
      }
      ws.onEvent?.(message);
    });
    ws.addEventListener('error', reject);
  });
}

async function waitForFile(path) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      return await readFile(path, 'utf8');
    } catch {
      await delay(50);
    }
  }
  throw new Error(`Timed out waiting for ${path}`);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
