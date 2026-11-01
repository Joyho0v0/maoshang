import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';

import App from './App.vue';
import { createLazyGeneratedContractAdapter } from './core/lazy-adapter';
import { SessionRuntime } from './core/session-runtime';
import { useSessionStore } from './core/session-store';
import { createAppRouter } from './router';
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
app.use(createAppRouter(createWebHistory()));
app.mount('#app');
sessionRuntime.subscribe((snapshot) => sessionStore.setSnapshot(snapshot));
void sessionRuntime.bootstrap().then((snapshot) => sessionStore.setSnapshot(snapshot));
