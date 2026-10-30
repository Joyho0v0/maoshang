<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import DataTable from '../ui/DataTable.vue';
import MoneyText from '../ui/MoneyText.vue';
import PageState from '../ui/PageState.vue';
import { asDecimalString } from '../core/formatters';
import { canUsePageCapability, displayStatus, listState, pageStateMessage, problemRequestId, routeString, routeStatus, useDomainApi } from './domain-page-helpers';
import type { Product, ResourcePage, Sku } from '../core/domain-api';

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const view = computed<'products' | 'skus'>(() => route.query.tab === 'catalog-skus' ? 'skus' : 'products');
const status = computed(() => routeStatus(route.query['filter[status]']));
const sort = computed(() => typeof route.query.sort === 'string' ? route.query.sort : undefined);
const cursor = computed(() => routeString(route.query.cursor));
const cursorHistory = ref<Array<string | undefined>>([]);
const options = computed(() => ({ status: status.value, sort: sort.value, cursor: cursor.value }));
const catalogQuery = useQuery<ResourcePage<Product> | ResourcePage<Sku>>({
  queryKey: computed(() => ['catalog', view.value, options.value]),
  queryFn: () => view.value === 'products' ? api.listProducts(options.value) : api.listSkus(options.value),
});
const state = computed(() => listState(catalogQuery.isPending.value, catalogQuery.data.value?.data.length, catalogQuery.error.value));
const stateCopy = computed(() => pageStateMessage(state.value));
const rows = computed(() => (catalogQuery.data.value?.data ?? []) as readonly Record<string, unknown>[]);
const productColumns = [
  { key: 'name', label: '商品名称' },
  { key: 'productCode', label: '编码' },
  { key: 'unit', label: '单位' },
  { key: 'status', label: '状态' },
] as const;
const skuColumns = [
  { key: 'name', label: 'SKU 名称' },
  { key: 'skuCode', label: 'SKU 编码' },
  { key: 'price', label: '价格' },
  { key: 'trackingMode', label: '跟踪方式' },
] as const;
function decimal(value: string) { return asDecimalString(value); }

function selectView(next: 'products' | 'skus'): void {
  cursorHistory.value = [];
  void router.replace({ path: '/catalog', query: { tab: next === 'skus' ? 'catalog-skus' : 'catalog-products', ...(status.value ? { 'filter[status]': status.value } : {}), ...(sort.value ? { sort: sort.value } : {}) } });
}

function updateStatus(event: globalThis.Event): void {
  const value = (event.target as globalThis.HTMLSelectElement).value;
  cursorHistory.value = [];
  void router.replace({ path: '/catalog', query: { tab: view.value === 'skus' ? 'catalog-skus' : 'catalog-products', ...(value ? { 'filter[status]': value } : {}), ...(sort.value ? { sort: sort.value } : {}) } });
}

function updateSort(event: globalThis.Event): void {
  const value = (event.target as globalThis.HTMLSelectElement).value;
  cursorHistory.value = [];
  void router.replace({ path: '/catalog', query: { tab: view.value === 'skus' ? 'catalog-skus' : 'catalog-products', ...(status.value ? { 'filter[status]': status.value } : {}), ...(value ? { sort: value } : {}) } });
}

function nextPage(): void {
  const nextCursor = catalogQuery.data.value?.page.nextCursor;
  if (nextCursor) {
    cursorHistory.value.push(cursor.value);
    void router.replace({ path: '/catalog', query: { tab: view.value === 'skus' ? 'catalog-skus' : 'catalog-products', ...(status.value ? { 'filter[status]': status.value } : {}), ...(sort.value ? { sort: sort.value } : {}), cursor: nextCursor } });
  }
}

function previousPage(): void {
  const previous = cursorHistory.value.pop();
  if (cursor.value === undefined) return;
  void router.replace({ path: '/catalog', query: { tab: view.value === 'skus' ? 'catalog-skus' : 'catalog-products', ...(status.value ? { 'filter[status]': status.value } : {}), ...(sort.value ? { sort: sort.value } : {}), ...(previous ? { cursor: previous } : {}) } });
}

function retry(): void {
  void catalogQuery.refetch();
}
</script>

<template>
  <div class="page domain-page">
    <section class="page-intro domain-page__intro">
      <div>
        <p class="eyebrow">
          目录与 SKU
        </p>
        <h1>商品目录</h1>
        <p>标准件与非标件共享同一份服务端契约；金额、单位和库存阈值始终按字符串展示。</p>
      </div>
      <RouterLink
        v-if="canUsePageCapability(api, view === 'products' ? 'product.create' : 'sku.create')"
        class="button"
        :to="view === 'products' ? '/catalog/products/new' : '/catalog/skus/new'"
      >
        新建{{ view === 'products' ? '商品' : 'SKU' }}
      </RouterLink>
    </section>

    <p
      v-if="api.scopeNotice"
      class="scope-notice"
      data-testid="scope-notice"
      role="status"
    >
      {{ api.scopeNotice }}
    </p>

    <div
      class="segment-tabs"
      role="tablist"
      aria-label="目录资源类型"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="view === 'products'"
        :class="{ 'is-active': view === 'products' }"
        @click="selectView('products')"
      >
        商品
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="view === 'skus'"
        :class="{ 'is-active': view === 'skus' }"
        @click="selectView('skus')"
      >
        SKU
      </button>
    </div>
    <section
      class="list-toolbar"
      aria-label="目录列表筛选"
    >
      <label for="catalog-status">状态</label>
      <select
        id="catalog-status"
        :value="status ?? ''"
        @change="updateStatus"
      >
        <option value="">
          全部状态
        </option>
        <option value="ACTIVE">
          启用
        </option>
        <option value="INACTIVE">
          停用
        </option>
      </select>
      <label for="catalog-sort">排序</label>
      <select
        id="catalog-sort"
        :value="sort ?? ''"
        @change="updateSort"
      >
        <option value="">
          默认排序
        </option>
        <option value="name">
          名称升序
        </option>
        <option value="-name">
          名称降序
        </option>
        <option value="-updatedAt,-id">
          最近更新
        </option>
      </select>
    </section>

    <PageState
      v-if="state !== 'ready' && state !== 'empty'"
      :state="state"
      :heading="stateCopy.heading"
      :message="stateCopy.message"
      :request-id="problemRequestId(catalogQuery.error.value)"
      action-label="重新加载"
      @action="retry"
    />
    <DataTable
      v-else
      :rows="rows"
      :columns="view === 'products' ? productColumns : skuColumns"
      row-key="id"
      :aria-label="view === 'products' ? '商品列表' : 'SKU 列表'"
      :state="state === 'empty' ? 'empty' : 'ready'"
      @retry="retry"
    >
      <template #cell-name="{ row }">
        <RouterLink :to="`/catalog/${view === 'products' ? 'products' : 'skus'}/${row.id}`">
          {{ row.name }}
        </RouterLink>
      </template>
      <template #cell-status="{ row }">
        {{ displayStatus(String(row.status)) }}
      </template>
      <template #cell-price="{ row }">
        <MoneyText
          v-if="typeof row.price === 'string'"
          :value="decimal(row.price)"
          currency="CNY"
        />
        <span v-else>未设置</span>
      </template>
      <template #cell-trackingMode="{ row }">
        {{ row.trackingMode === 'NONE' ? '不跟踪' : row.trackingMode === 'LOT' ? '批次' : '序列号' }}
      </template>
    </DataTable>
    <nav
      v-if="state === 'ready'"
      class="cursor-pager"
      aria-label="目录列表分页"
    >
      <button
        class="button button--quiet"
        type="button"
        :disabled="cursor === undefined"
        @click="previousPage"
      >
        上一页
      </button>
      <button
        class="button button--quiet"
        type="button"
        :disabled="!catalogQuery.data.value?.page.nextCursor"
        @click="nextPage"
      >
        下一页
      </button>
    </nav>
  </div>
</template>
