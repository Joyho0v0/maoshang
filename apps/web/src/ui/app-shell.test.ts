import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';

import AppShell from './AppShell.vue';

describe('AppShell', () => {
  it('provides accessible navigation and renders the routed shell content', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<p data-testid="route-content">工作台内容</p>' } },
        { path: '/workspace', component: { template: '<p>工作台</p>' } },
        { path: '/empty', component: { template: '<p>待办中心</p>' } },
        { path: '/loading', component: { template: '<p>同步状态</p>' } },
      ],
    });
    await router.push('/');
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: { plugins: [router] },
    });

    expect(wrapper.get('a.skip-link').text()).toContain('跳到主要内容');
    expect(wrapper.get('nav[aria-label="主导航"]')).toBeTruthy();
    expect(wrapper.get('.nav-links').findAll('a')).toHaveLength(6);
    expect(wrapper.get('.nav-links').text()).toContain('客户');
    expect(wrapper.get('.nav-links').text()).toContain('商品');
    expect(wrapper.get('.nav-links').text()).toContain('订单');
    expect(wrapper.get('[data-testid="route-content"]').text()).toBe('工作台内容');
    expect(wrapper.get('main').attributes('id')).toBe('main-content');
    expect(wrapper.text()).toContain('契约接入准备中');
    expect(wrapper.text()).not.toContain('安全连接已建立');
  });
});
