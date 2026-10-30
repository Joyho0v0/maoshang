<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import DataTable from '../ui/DataTable.vue';
import MoneyText from '../ui/MoneyText.vue';
import PageState from '../ui/PageState.vue';
import type { Order } from '../core/domain-api';
import { asDecimalString } from '../core/formatters';
import { displayStatus, listState, pageStateMessage, problemRequestId, queryFromRoute, routeStatus, useDomainApi } from './domain-page-helpers';

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const status = computed(() => routeStatus(route.query['filter[status]']));
const sort = computed(() => typeof route.query.sort === 'string' ? route.query.sort : undefined);
const cursor = computed(() => typeof route.query.cursor === 'string' ? route.query.cursor : undefined);
const options = computed(() => ({ status: status.value, sort: sort.value, cursor: cursor.value }));
const ordersQuery = useQuery({
  queryKey: computed(() => ['orders', options.value]),
  queryFn: () => api.listOrders(options.value),
});
const state = computed(() => listState(ordersQuery.isPending.value, ordersQuery.data.value?.data.length, ordersQuery.error.value));
const stateCopy = computed(() => pageStateMessage(state.value));
const rows = computed(() => (ordersQuery.data.value?.data ?? []) as readonly Record<string, unknown>[]);
function decimal(value: string) { return asDecimalString(value); }
const columns = [
  { key: 'orderNo', label: '订单号' },
  { key: 'status', label: '阶段' },
  { key: 'currency', label: '币种' },
  { key: 'totalAmount', label: '权威金额' },
  { key: 'updatedAt', label: '最近更新' },
] as const;

function retry(): void {
  void ordersQuery.refetch();
}

function updateStatus(event: globalThis.Event): void {
  const value = (event.target as globalThis.HTMLSelectElement).value;
  void router.replace({ path: '/orders', query: queryFromRoute(value || undefined, sort.value, undefined) });
}

function hasTransition(order: Order, transition: string): boolean {
  return order.allowedTransitions?.includes(transition) ?? false;
}
</script>

<template>
  <div class="page domain-page">
    <section class="page-intro domain-page__intro">
      <div>
        <p class="eyebrow">
          订单履约
        </p>
        <h1>订单</h1>
        <p>订单明细保留创建时的商品快照、价格和汇率；阶段按钮完全由服务端返回的 allowedTransitions 驱动。</p>
      </div>
      <RouterLink
        class="button"
        to="/orders/new"
      >
        新建订单
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
    <section
      class="list-toolbar"
      aria-label="订单列表筛选"
    >
      <label for="order-status">订单阶段</label>
      <select
        id="order-status"
        :value="status ?? ''"
        @change="updateStatus"
      >
        <option value="">
          全部阶段
        </option>
        <option value="DRAFT">
          草稿
        </option>
        <option value="CONFIRMED">
          已确认
        </option>
        <option value="FULFILLED">
          已履约
        </option>
        <option value="CANCELLED">
          已取消
        </option>
      </select>
    </section>

    <PageState
      v-if="state !== 'ready' && state !== 'empty'"
      :state="state"
      :heading="stateCopy.heading"
      :message="stateCopy.message"
      :request-id="problemRequestId(ordersQuery.error.value)"
      action-label="重新加载"
      @action="retry"
    />
    <DataTable
      v-else
      :rows="rows"
      :columns="columns"
      row-key="id"
      aria-label="订单列表"
      :state="state === 'empty' ? 'empty' : 'ready'"
      @retry="retry"
    >
      <template #cell-orderNo="{ row }">
        <RouterLink :to="`/orders/${row.id}`">
          {{ row.orderNo }}
        </RouterLink>
      </template>
      <template #cell-status="{ row }">
        {{ displayStatus(String(row.status)) }}
      </template>
      <template #cell-totalAmount="{ row }">
        <span data-testid="order-total">
          <MoneyText
            v-if="typeof row.totalAmount === 'string'"
            :value="decimal(row.totalAmount)"
            :currency="String(row.currency)"
          />
          <span v-else>未提供</span>
        </span>
      </template>
      <template #actions="{ row }">
        <RouterLink
          v-if="hasTransition(row as Order, 'CONFIRM')"
          class="button button--quiet button--compact"
          data-testid="order-transition-CONFIRM"
          :to="`/orders/${row.id}`"
        >
          确认订单
        </RouterLink>
        <span
          v-else
          class="muted-action"
        >阶段由服务端控制</span>
      </template>
    </DataTable>
  </div>
</template>
