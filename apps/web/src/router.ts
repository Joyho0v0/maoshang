import type { RouterHistory } from 'vue-router';
import { createRouter } from 'vue-router';

export function createAppRouter(history: RouterHistory) {
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
        path: '/loading',
        name: 'loading',
        component: () => import('./pages/LoadingPage.vue'),
      },
      {
        path: '/error',
        name: 'error',
        component: () => import('./pages/ErrorPage.vue'),
      },
      {
        path: '/empty',
        name: 'empty',
        component: () => import('./pages/EmptyPage.vue'),
      },
      { path: '/:pathMatch(.*)*', redirect: '/workspace' },
    ],
  });
}
