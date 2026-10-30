import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import App from './App.vue';
import { createLazyGeneratedContractAdapter } from './core/lazy-adapter';
import { SessionRuntime } from './core/session-runtime';
import { createAppRouter } from './router';
import './styles.css';

const app = createApp(App);
const sessionRuntime = new SessionRuntime(createLazyGeneratedContractAdapter());
app.config.errorHandler = () => {
  // GlobalErrorBoundary owns user-facing recovery. Do not send raw errors to logs.
};
app.provide('session-runtime', sessionRuntime);
app.use(createAppRouter(createWebHistory()));
app.mount('#app');
void sessionRuntime.bootstrap();
