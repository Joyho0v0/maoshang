import { flushPromises, mount } from '@vue/test-utils';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

import { DOMAIN_API_KEY } from '../core/domain-api';
import type { DomainApi } from '../core/domain-api';
import { createFixtureDomainApi } from '../core/domain-fixtures';
import CustomersPage from './CustomersPage.vue';
import CustomerDetailPage from './CustomerDetailPage.vue';
import CustomerFormPage from './CustomerFormPage.vue';
import CatalogFormPage from './CatalogFormPage.vue';
import OrdersPage from './OrdersPage.vue';
import OrderFormPage from './OrderFormPage.vue';

async function mountPage(component: Component, path: string, api: DomainApi = createFixtureDomainApi()) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/customers/new', component },
      { path: '/customers/:id', component },
      { path: '/catalog/skus/new', component },
      { path: '/orders/new', component },
      { path: '/orders/:id', component },
      { path: '/:pathMatch(.*)*', component },
    ],
  });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(component, {
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }]],
      provide: { [DOMAIN_API_KEY as symbol]: api },
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
    expect(wrapper.find('[data-testid="customer-submit-approval"]').exists()).toBe(false);
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
    expect(wrapper.find('[data-testid="order-transition-CONFIRM"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="order-transition-FULFILL"]')).toHaveLength(0);
  });

  it('does not ship fixture identifiers as production form defaults', async () => {
    const customer = await mountPage(CustomerFormPage, '/customers/new');
    expect((customer.get('#customer-owner').element as HTMLInputElement).value).toBe('');

    const sku = await mountPage(CatalogFormPage, '/catalog/skus/new');
    expect((sku.get('#catalog-product').element as HTMLInputElement).value).toBe('');
    expect(sku.get('#catalog-product').element.tagName).toBe('SELECT');

    const order = await mountPage(OrderFormPage, '/orders/new');
    expect((order.get('#order-customer').element as HTMLInputElement).value).toBe('');
    expect((order.get('#order-sku').element as HTMLInputElement).value).toBe('');
    expect((order.get('#order-no').element as HTMLInputElement).value).toBe('');
    expect(order.get('#order-customer').element.tagName).toBe('SELECT');
    expect(order.get('#order-sku').element.tagName).toBe('SELECT');
  });

  it('collects reject reason before a customer command and associates form errors', async () => {
    const wrapper = await mountPage(CustomerDetailPage, '/customers/00000000-0000-4000-8000-000000000101');

    const reject = wrapper.get('[data-testid="customer-reject"]');
    await reject.trigger('click');
    expect(wrapper.get('[role="dialog"]').text()).toContain('驳回原因');
    await wrapper.get('#customer-command-form').trigger('submit');
    expect(wrapper.get('#customer-reject-reason').attributes('aria-describedby')).toContain('customer-reject-reason-error');

    const form = await mountPage(CustomerFormPage, '/customers/new');
    await form.get('form').trigger('submit');
    await flushPromises();
    expect(form.get('#customer-name').attributes('aria-describedby')).toContain('customer-name-error');
  });

  it('does not navigate until an accepted create has an authoritative resource', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const createdCustomer = (await createFixtureDomainApi().getCustomer('00000000-0000-4000-8000-000000000101')).data;
    const createCustomer = vi.fn<DomainApi['createCustomer']>(async () => ({
      kind: 'pending' as const,
      commandId: 'command-page-1',
      operationId: 'createCustomer',
      idempotencyKey: 'idem-page-1',
      state: 'IN_PROGRESS' as const,
      recover: async () => ({
        kind: 'resource' as const,
        data: { ...createdCustomer, id: '00000000-0000-4000-8000-000000000901' },
        etag: 'W/"customer-created"',
      }),
    }));
    api.createCustomer = createCustomer;

    const wrapper = await mountPage(CustomerFormPage, '/customers/new', api);
    await wrapper.get('#customer-name').setValue('新客户');
    await wrapper.get('#customer-owner').setValue('00000000-0000-4000-8000-000000000002');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createCustomer).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.$router.currentRoute.value.fullPath).toBe('/customers/00000000-0000-4000-8000-000000000901');
    expect(wrapper.vm.$router.currentRoute.value.fullPath).not.toContain('undefined');
  });

  it('distinguishes a stable pending failure from an unknown result', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const createCustomer = vi.fn<DomainApi['createCustomer']>(async () => ({
      kind: 'pending' as const,
      commandId: 'command-page-stable-failure',
      operationId: 'createCustomer',
      idempotencyKey: 'idem-page-stable-failure',
      state: 'RESULT_UNKNOWN' as const,
      recover: async () => {
        throw { problem: { type: 'about:blank', title: '幂等键已被占用', status: 409, code: 'IDEMPOTENCY_KEY_REUSED' } };
      },
    }));
    api.createCustomer = createCustomer;

    const wrapper = await mountPage(CustomerFormPage, '/customers/new', api);
    await wrapper.get('#customer-name').setValue('稳定失败客户');
    await wrapper.get('#customer-owner').setValue('00000000-0000-4000-8000-000000000002');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('稳定失败');
    expect(wrapper.find('[data-testid="recover-pending"]').exists()).toBe(false);
    expect(wrapper.vm.$router.currentRoute.value.fullPath).toBe('/customers/new');
  });
});
