import type { RouterHistory } from 'vue-router';
import { createRouter } from 'vue-router';

export function createAppRouter(history: RouterHistory) {
  const includeUiHarness = import.meta.env.DEV || import.meta.env.MODE === 'test';

  return createRouter({
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
        component: () => import('./pages/CustomersPage.vue'),
      },
      {
        path: '/customers/new',
        name: 'customer-create',
        component: () => import('./pages/CustomerFormPage.vue'),
      },
      {
        path: '/customers/:id',
        name: 'customer-detail',
        component: () => import('./pages/CustomerDetailPage.vue'),
      },
      {
        path: '/customers/:id/edit',
        name: 'customer-edit',
        component: () => import('./pages/CustomerFormPage.vue'),
      },
      {
        path: '/catalog',
        name: 'catalog',
        component: () => import('./pages/CatalogPage.vue'),
      },
      {
        path: '/catalog/products/:id',
        name: 'product-detail',
        component: () => import('./pages/ProductDetailPage.vue'),
      },
      {
        path: '/catalog/products/new',
        name: 'product-create',
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/catalog/products/:id/edit',
        name: 'product-edit',
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/catalog/skus/:id',
        name: 'sku-detail',
        component: () => import('./pages/SkuDetailPage.vue'),
      },
      {
        path: '/catalog/skus/new',
        name: 'sku-create',
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/catalog/skus/:id/edit',
        name: 'sku-edit',
        component: () => import('./pages/CatalogFormPage.vue'),
      },
      {
        path: '/orders',
        name: 'orders',
        component: () => import('./pages/OrdersPage.vue'),
      },
      {
        path: '/orders/new',
        name: 'order-create',
        component: () => import('./pages/OrderFormPage.vue'),
      },
      {
        path: '/orders/:id',
        name: 'order-detail',
        component: () => import('./pages/OrderDetailPage.vue'),
      },
      {
        path: '/orders/:id/edit',
        name: 'order-edit',
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
}
