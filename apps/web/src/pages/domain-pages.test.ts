import { flushPromises, mount } from '@vue/test-utils';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

import { DOMAIN_API_KEY } from '../core/domain-api';
import type { Customer, DomainApi, Product, ResourcePage, ResourceResult, Sku } from '../core/domain-api';
import { createFixtureDomainApi } from '../core/domain-fixtures';
import CustomersPage from './CustomersPage.vue';
import CustomerDetailPage from './CustomerDetailPage.vue';
import CustomerFormPage from './CustomerFormPage.vue';
import CatalogFormPage from './CatalogFormPage.vue';
import OrdersPage from './OrdersPage.vue';
import OrderFormPage from './OrderFormPage.vue';

function withoutEtag<T>(result: ResourceResult<T>): Omit<ResourceResult<T>, 'etag'> {
  const resultWithoutEtag = { ...result };
  delete resultWithoutEtag.etag;
  return resultWithoutEtag;
}

function resourcePage<T>(data: readonly T[], nextCursor: string | null = null): ResourcePage<T> {
  return { data, page: { nextCursor, hasNext: nextCursor !== null } };
}

async function mountPage(component: Component, path: string, api: DomainApi = createFixtureDomainApi()) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/customers/new', component },
      { path: '/customers/:id', component },
      { path: '/customers/:id/edit', component },
      { path: '/catalog/skus/new', component },
      { path: '/catalog/skus/:id/edit', component },
      { path: '/catalog/products/:id/edit', component },
      { path: '/orders/new', component },
      { path: '/orders/:id', component },
      { path: '/orders/:id/edit', component },
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

  it.each([
    {
      action: 'REJECT' as const,
      customerId: '00000000-0000-4000-8000-000000000101',
      trigger: '[data-testid="customer-reject"]',
      field: '#customer-reject-reason',
      value: '请补充收货主体。',
    },
    {
      action: 'REASSIGN' as const,
      customerId: '00000000-0000-4000-8000-000000000102',
      trigger: '[data-testid="customer-reassign"]',
      field: '#customer-reassign-assignee',
      value: '00000000-0000-4000-8000-000000000003',
    },
  ])('sends a $action dialog command only once while the API is deferred', async ({ action, customerId, trigger, field, value }) => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const deferred = new Promise<Awaited<ReturnType<DomainApi['commandCustomer']>>>(() => undefined);
    const commandCustomer = vi.fn<DomainApi['commandCustomer']>(() => deferred);
    api.commandCustomer = commandCustomer;

    const wrapper = await mountPage(CustomerDetailPage, `/customers/${customerId}`, api);
    await wrapper.get(trigger).trigger('click');
    await wrapper.get(field).setValue(value);
    const form = wrapper.get('#customer-command-form');
    await form.trigger('submit');
    await form.trigger('submit');

    expect(commandCustomer).toHaveBeenCalledTimes(1);
    expect(commandCustomer.mock.calls[0]?.[1]).toMatchObject({ action });
  });

  it('treats a direct opaque cursor as opaque and resets history when the filter changes', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const base = createFixtureDomainApi();
    const firstPage = await base.listCustomers();
    const listCustomers = vi.fn<DomainApi['listCustomers']>(async (options) => {
      if (options?.cursor === 'opaque-page-2') return { ...firstPage, page: { ...firstPage.page, nextCursor: null, hasNext: false } };
      return { ...firstPage, page: { ...firstPage.page, nextCursor: 'opaque-page-2', hasNext: true } };
    });
    api.listCustomers = listCustomers;

    const wrapper = await mountPage(CustomersPage, '/customers?cursor=opaque-page-2', api);
    expect(listCustomers).toHaveBeenCalledWith(expect.objectContaining({ cursor: 'opaque-page-2' }));
    const previous = wrapper.get('nav[aria-label="客户列表分页"] button');
    expect((previous.element as HTMLButtonElement).disabled).toBe(true);

    await wrapper.get('#customer-status').setValue('DRAFT');
    await flushPromises();
    expect((wrapper.get('nav[aria-label="客户列表分页"] button').element as HTMLButtonElement).disabled).toBe(true);
  });

  it.each([
    { label: 'customer', component: CustomerFormPage, path: '/customers/00000000-0000-4000-8000-000000000101/edit' },
    { label: 'product', component: CatalogFormPage, path: '/catalog/products/00000000-0000-4000-8000-000000000201/edit' },
    { label: 'sku', component: CatalogFormPage, path: '/catalog/skus/00000000-0000-4000-8000-000000000301/edit' },
    { label: 'order', component: OrderFormPage, path: '/orders/00000000-0000-4000-8000-000000000401/edit' },
  ])('disables the $label edit save when the resource has no ETag', async ({ label, component, path }) => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const fixture = createFixtureDomainApi();
    let updateCalled = false;
    if (label === 'customer') {
      const current = await fixture.getCustomer('00000000-0000-4000-8000-000000000101');
      api.getCustomer = async () => withoutEtag(current);
      api.updateCustomer = async () => { updateCalled = true; return current; };
    } else if (label === 'product') {
      const current = await fixture.getProduct('00000000-0000-4000-8000-000000000201');
      api.getProduct = async () => withoutEtag(current);
      api.updateProduct = async () => { updateCalled = true; return current; };
    } else if (label === 'sku') {
      const current = await fixture.getSku('00000000-0000-4000-8000-000000000301');
      api.getSku = async () => withoutEtag(current);
      api.updateSku = async () => { updateCalled = true; return current; };
    } else {
      const current = await fixture.getOrder('00000000-0000-4000-8000-000000000401');
      api.getOrder = async () => withoutEtag(current);
      api.updateOrder = async () => { updateCalled = true; return current; };
    }

    const wrapper = await mountPage(component, path, api);
    const save = wrapper.get('button[type="submit"]');
    expect((save.element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.text()).toContain('服务端未返回 ETag');
    await wrapper.get('form').trigger('submit');
    expect(updateCalled).toBe(false);
  });

  it('shows conflict Problem metadata instead of relabeling the stale query ETag as current', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const fixture = createFixtureDomainApi();
    const current = await fixture.getCustomer('00000000-0000-4000-8000-000000000101');
    const stale: ResourceResult<Customer> = { ...current, etag: 'W/"stale"' };
    const updateCustomer = vi.fn<DomainApi['updateCustomer']>(async () => {
      throw {
        problem: {
          type: 'urn:autoflow:problem:version-conflict',
          title: '内容已被其他人更新，请刷新后重做。',
          status: 409,
          code: 'VERSION_CONFLICT',
          meta: { currentVersion: 9, currentEtag: 'W/"new"' },
        },
      };
    });
    api.getCustomer = async () => stale;
    api.updateCustomer = updateCustomer;

    const wrapper = await mountPage(CustomerFormPage, '/customers/00000000-0000-4000-8000-000000000101/edit', api);
    await wrapper.get('#customer-name').setValue('冲突后的名称');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.text()).toContain('当前版本：9');
    expect(dialog.text()).toContain('当前 ETag：W/"new"');
    expect(dialog.text()).not.toContain('W/"stale"');
    expect(updateCustomer).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000101',
      expect.anything(),
      'W/"stale"',
    );
  });

  it('loads the second page of authorized Product references without losing the first page', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const fixture = createFixtureDomainApi();
    const template = await fixture.getProduct('00000000-0000-4000-8000-000000000201');
    const products: Product[] = Array.from({ length: 21 }, (_, index) => ({
      ...template.data,
      id: `00000000-0000-4000-8000-${String(201 + index).padStart(12, '0')}`,
      name: `授权商品 ${index + 1}`,
      productCode: `AUTH-${String(index + 1).padStart(2, '0')}`,
    }));
    const listProducts = vi.fn<DomainApi['listProducts']>(async (options) => (
      options?.cursor ? resourcePage(products.slice(20)) : resourcePage(products.slice(0, 20), 'opaque-products-next')
    ));
    api.listProducts = listProducts;

    const wrapper = await mountPage(CatalogFormPage, '/catalog/skus/new', api);
    expect(wrapper.findAll('#catalog-product option')).toHaveLength(21);
    await wrapper.get('[data-testid="catalog-products-load-more"]').trigger('click');
    await flushPromises();

    expect(listProducts).toHaveBeenLastCalledWith({ cursor: 'opaque-products-next' });
    expect(wrapper.findAll('#catalog-product option')).toHaveLength(22);
    await wrapper.get('#catalog-product').setValue(products[20]?.id ?? '');
    expect((wrapper.get('#catalog-product').element as HTMLSelectElement).value).toBe(products[20]?.id);
  });

  it('loads both paginated Customer and SKU references for order creation', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const fixture = createFixtureDomainApi();
    const customerTemplate = await fixture.getCustomer('00000000-0000-4000-8000-000000000101');
    const skuTemplate = await fixture.getSku('00000000-0000-4000-8000-000000000301');
    const customers: Customer[] = Array.from({ length: 21 }, (_, index) => ({
      ...customerTemplate.data,
      id: `00000000-0000-4000-8000-${String(101 + index).padStart(12, '0')}`,
      name: `授权客户 ${index + 1}`,
    }));
    const skus: Sku[] = Array.from({ length: 21 }, (_, index) => ({
      ...skuTemplate.data,
      id: `00000000-0000-4000-8000-${String(301 + index).padStart(12, '0')}`,
      skuCode: `AUTH-SKU-${String(index + 1).padStart(2, '0')}`,
      name: `授权 SKU ${index + 1}`,
    }));
    const listCustomers = vi.fn<DomainApi['listCustomers']>(async (options) => (
      options?.cursor ? resourcePage(customers.slice(20)) : resourcePage(customers.slice(0, 20), 'opaque-customers-next')
    ));
    const listSkus = vi.fn<DomainApi['listSkus']>(async (options) => (
      options?.cursor ? resourcePage(skus.slice(20)) : resourcePage(skus.slice(0, 20), 'opaque-skus-next')
    ));
    api.listCustomers = listCustomers;
    api.listSkus = listSkus;

    const wrapper = await mountPage(OrderFormPage, '/orders/new', api);
    expect(wrapper.findAll('#order-customer option')).toHaveLength(21);
    expect(wrapper.findAll('#order-sku option')).toHaveLength(21);
    await wrapper.get('[data-testid="order-customers-load-more"]').trigger('click');
    await wrapper.get('[data-testid="order-skus-load-more"]').trigger('click');
    await flushPromises();

    expect(listCustomers).toHaveBeenLastCalledWith({ cursor: 'opaque-customers-next' });
    expect(listSkus).toHaveBeenLastCalledWith({ cursor: 'opaque-skus-next' });
    expect(wrapper.findAll('#order-customer option')).toHaveLength(22);
    expect(wrapper.findAll('#order-sku option')).toHaveLength(22);
    await wrapper.get('#order-customer').setValue(customers[20]?.id ?? '');
    await wrapper.get('#order-sku').setValue(skus[20]?.id ?? '');
    expect((wrapper.get('#order-customer').element as HTMLSelectElement).value).toBe(customers[20]?.id);
    expect((wrapper.get('#order-sku').element as HTMLSelectElement).value).toBe(skus[20]?.id);
  });

  it('shows loading for an unresolved SKU Product reference and blocks create', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    let resolveProducts: (value: ResourcePage<Product>) => void = () => undefined;
    api.listProducts = () => new Promise<ResourcePage<Product>>((resolve) => { resolveProducts = resolve; });

    const wrapper = await mountPage(CatalogFormPage, '/catalog/skus/new', api);
    expect(wrapper.find('[data-testid="catalog-product-reference-state"] .state-panel--loading').exists()).toBe(true);
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true);

    resolveProducts(resourcePage([]));
    await flushPromises();
  });

  it.each([
    { scenario: 'empty-group' as const, stateClass: 'state-panel--empty' },
    { scenario: 'forbidden' as const, stateClass: 'state-panel--forbidden' },
    { scenario: 'offline' as const, stateClass: 'state-panel--offline' },
    { scenario: 'error' as const, stateClass: 'state-panel--error' },
  ])('blocks SKU create when Product references are $scenario', async ({ scenario, stateClass }) => {
    const wrapper = await mountPage(CatalogFormPage, '/catalog/skus/new', createFixtureDomainApi({ scenario }));

    expect(wrapper.find(`[data-testid="catalog-product-reference-state"] .${stateClass}`).exists()).toBe(true);
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true);
  });

  it('retries a failed Product reference query and exposes the selection once ready', async () => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    const fixture = createFixtureDomainApi();
    const product = await fixture.getProduct('00000000-0000-4000-8000-000000000201');
    let attempts = 0;
    api.listProducts = async () => {
      attempts += 1;
      if (attempts === 1) throw { problem: { type: 'about:blank', title: '目录服务不可用', status: 503, code: 'DEPENDENCY_UNAVAILABLE' } };
      return resourcePage([product.data]);
    };

    const wrapper = await mountPage(CatalogFormPage, '/catalog/skus/new', api);
    expect(wrapper.find('[data-testid="catalog-product-reference-state"] .state-panel--offline').exists()).toBe(true);
    await wrapper.get('[data-testid="catalog-product-reference-state"] button').trigger('click');
    await flushPromises();

    expect(attempts).toBe(2);
    expect(wrapper.find('[data-testid="catalog-product-reference-state"] .state-panel--offline').exists()).toBe(false);
    expect(wrapper.findAll('#catalog-product option')).toHaveLength(2);
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(false);
  });

  it.each(['customers', 'skus'] as const)('keeps Order create blocked when the %s reference query is forbidden', async (failedReference) => {
    const api = Object.create(createFixtureDomainApi()) as DomainApi;
    if (failedReference === 'customers') {
      api.listCustomers = async () => { throw { problem: { type: 'about:blank', title: '客户范围受限', status: 403, code: 'PERMISSION_DENIED' } }; };
    } else {
      api.listSkus = async () => { throw { problem: { type: 'about:blank', title: 'SKU 范围受限', status: 403, code: 'PERMISSION_DENIED' } }; };
    }

    const wrapper = await mountPage(OrderFormPage, '/orders/new', api);
    expect(wrapper.find(`[data-testid="order-${failedReference}-reference-state"] .state-panel--forbidden`).exists()).toBe(true);
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true);
  });
});
