import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';

import App from './App.vue';
import { createProductionDomainApi, DOMAIN_API_KEY } from './core/domain-api';
import { createLazyGeneratedContractAdapter } from './core/lazy-adapter';
import { SessionRuntime } from './core/session-runtime';
import { useSessionStore } from './core/session-store';
import { createAppRouter } from './router';
import type { FixtureScenario } from './core/domain-fixtures';
import './styles.css';

const app = createApp(App);
const sessionRuntime = new SessionRuntime(createLazyGeneratedContractAdapter());
const pinia = createPinia();
const sessionStore = useSessionStore(pinia);
app.config.errorHandler = () => {
  // GlobalErrorBoundary owns user-facing recovery. Do not send raw errors to logs.
};
app.provide('session-runtime', sessionRuntime);
app.use(pinia);
app.use(VueQueryPlugin, { queryClient: sessionRuntime.queryClient });
app.use(createAppRouter(createWebHistory(), sessionRuntime));
sessionRuntime.subscribe((snapshot) => sessionStore.setSnapshot(snapshot));

async function start(): Promise<void> {
  const domainApi = import.meta.env.MODE === 'production'
    ? createProductionDomainApi(sessionRuntime)
    : (await import('./core/domain-fixtures')).createFixtureDomainApi({ scenario: fixtureScenario() });
  app.provide(DOMAIN_API_KEY, domainApi);
  const snapshot = await sessionRuntime.bootstrap();
  sessionStore.setSnapshot(snapshot);
  app.mount('#app');
}

function fixtureScenario(): FixtureScenario {
  const value = new URLSearchParams(globalThis.location.search).get('fixture');
  return ['ready', 'reference-pages', 'empty', 'empty-group', 'forbidden', 'offline', 'error', 'conflict', 'precondition'].includes(value ?? '')
    ? value as FixtureScenario
    : 'ready';
}

void start();
