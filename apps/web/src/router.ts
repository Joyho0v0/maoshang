import type { RouterHistory } from 'vue-router';
import { createRouter } from 'vue-router';
import type { SessionRuntime } from './core/session-runtime';

export function createAppRouter(history: RouterHistory, runtime?: Pick<SessionRuntime, 'snapshot'>) {
  const includeUiHarness = import.meta.env.DEV || import.meta.env.MODE === 'test';

  const router = createRouter({
    history,
    routes: [
      { path: '/', redirect: '/workspace' },
      {
        path: '/workspace',
        name: 'workspace',
        component: () => import('./pages/WorkspacePage.vue'),
      },
      {
        path: '/customers',
        name: 'customers',
        meta: { requiredCapability: 'customer.read' },
        component: () => import('./pages/CustomersPage.vue'),
      },
      {
        path: '/customers/new',
        name: 'customer-create',
        meta: { requiredCapability: 'customer.create' },
        component: () => import('./pages/CustomerFormPage.vue'),
      },
      {
        path: '/customers/:id',
        name: 'customer-detail',
        meta: { requiredCapability: 'customer.read' },
        component: () => import('./pages/CustomerDetailPage.vue'),
      },
      {
        path: '/customers/:id/edit',
        name: 'customer-edit',
        meta: { requiredCapability: 'customer.update' },
        component: () => import('./pages/CustomerFormPage.vue'),
      },
      {
        path: '/catalog',
        name: 'catalog',
        meta: { requiredCapability: 'product.read' },
        component: () => import('./pages/CatalogPage.vue'),
      },
      {
        path: '/catalog/products/:id',
        name: 'product-detail',
        meta: { requiredCapability: 'product.read' },
        component: () => import('./pages/ProductDetailPage.vue'),
      },
      {
        path: '/catalog/products/new',
        name: 'product-create',
        meta: { requiredCapability: 'product.create' },
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/catalog/products/:id/edit',
        name: 'product-edit',
        meta: { requiredCapability: 'product.update' },
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/catalog/skus/:id',
        name: 'sku-detail',
        meta: { requiredCapability: 'sku.read' },
        component: () => import('./pages/SkuDetailPage.vue'),
      },
      {
        path: '/catalog/skus/new',
        name: 'sku-create',
        meta: { requiredCapability: 'sku.create' },
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/catalog/skus/:id/edit',
        name: 'sku-edit',
        meta: { requiredCapability: 'sku.update' },
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/orders',
        name: 'orders',
        meta: { requiredCapability: 'order.read' },
        component: () => import('./pages/OrdersPage.vue'),
      },
      {
        path: '/orders/new',
        name: 'order-create',
        meta: { requiredCapability: 'order.create' },
        component: () => import('./pages/OrderFormPage.vue'),
      },
      {
        path: '/orders/:id',
        name: 'order-detail',
        meta: { requiredCapability: 'order.read' },
        component: () => import('./pages/OrderDetailPage.vue'),
      },
      {
        path: '/orders/:id/edit',
        name: 'order-edit',
        meta: { requiredCapability: 'order.update' },
        component: () => import('./pages/OrderFormPage.vue'),
      },
      {
        path: '/loading',
        name: 'loading',
        component: () => import('./pages/LoadingPage.vue'),
      },
      {
        path: '/error',
        name: 'error',
        component: () => import('./pages/ErrorPage.vue'),
      },
      ...(includeUiHarness ? [{
        path: '/__ui-harness',
        name: 'ui-harness',
        component: () => import('./pages/UiHarnessPage.vue'),
      }] : []),
      {
        path: '/empty',
        name: 'empty',
        component: () => import('./pages/EmptyPage.vue'),
      },
      { path: '/:pathMatch(.*)*', redirect: '/workspace' },
    ],
  });
  router.beforeEach((to) => {
    const required = to.meta.requiredCapability;
    const snapshot = runtime?.snapshot;
    if (typeof required === 'string' && snapshot?.status === 'authenticated' && !snapshot.identity?.capabilities.includes(required)) {
      return { name: 'workspace', query: { forbidden: '1' } };
    }
    return true;
  });
  return router;
}
