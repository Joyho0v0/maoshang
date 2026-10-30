import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

import { DOMAIN_API_KEY } from '../core/domain-api';
import { createFixtureDomainApi } from '../core/domain-fixtures';
import CustomersPage from './CustomersPage.vue';
import OrdersPage from './OrdersPage.vue';

async function mountPage(component: typeof CustomersPage, path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component }],
  });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(component, {
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }]],
      provide: { [DOMAIN_API_KEY as symbol]: createFixtureDomainApi() },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('domain vertical-slice pages', () => {
  it('renders customer data, approval controls, and a safe filter URL', async () => {
    const wrapper = await mountPage(CustomersPage, '/customers');

    expect(wrapper.get('h1').text()).toContain('客户');
    expect(wrapper.get('table').text()).toContain('北方星辰贸易');
    expect(wrapper.get('[data-testid="customer-submit-approval"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.findAll('[data-testid="customer-contact-email"]')).toHaveLength(0);

    await wrapper.get('#customer-status').setValue('DRAFT');
    await flushPromises();
    expect(wrapper.vm.$router.currentRoute.value.query['filter[status]']).toBe('DRAFT');
    expect(wrapper.vm.$router.currentRoute.value.fullPath).not.toContain('contact@example.test');
  });

  it('renders order snapshots and server-provided transitions without calculating totals', async () => {
    const wrapper = await mountPage(OrdersPage, '/orders');

    expect(wrapper.get('h1').text()).toContain('订单');
    expect(wrapper.get('table').text()).toContain('SO-20261030-001');
    expect(wrapper.get('[data-testid="order-total"]').text()).toContain('2,220.000');
    expect(wrapper.get('[data-testid="order-transition-CONFIRM"]').text()).toContain('确认订单');
    expect(wrapper.findAll('[data-testid="order-transition-FULFILL"]')).toHaveLength(0);
  });
});
