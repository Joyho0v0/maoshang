<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import DataTable from '../ui/DataTable.vue';
import PageState from '../ui/PageState.vue';
import {
  displayStatus,
  canUsePageCapability,
  listState,
  pageStateMessage,
  problemRequestId,
  queryFromRoute,
  rememberCursor,
  routeStatus,
  useDomainApi,
} from './domain-page-helpers';

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const status = computed(() => routeStatus(route.query['filter[status]']));
const sort = computed(() => typeof route.query.sort === 'string' ? route.query.sort : undefined);
const cursor = computed(() => typeof route.query.cursor === 'string' ? route.query.cursor : undefined);
const cursorHistory = ref<Array<string | undefined>>([]);
const queryOptions = computed(() => ({ status: status.value, sort: sort.value, cursor: cursor.value }));
const customersQuery = useQuery({
  queryKey: computed(() => ['customers', queryOptions.value]),
  queryFn: () => api.listCustomers(queryOptions.value),
});
const state = computed(() => listState(
  customersQuery.isPending.value,
  customersQuery.data.value?.data.length,
  customersQuery.error.value,
));
const stateCopy = computed(() => pageStateMessage(state.value));
const rows = computed(() => (customersQuery.data.value?.data ?? []) as readonly Record<string, unknown>[]);
const hasNext = computed(() => Boolean(customersQuery.data.value?.page.nextCursor));

const columns = [
  { key: 'name', label: '客户名称' },
  { key: 'status', label: '状态' },
  { key: 'ownerUserId', label: '负责人' },
  { key: 'updatedAt', label: '最近更新' },
] as const;

function updateStatus(event: globalThis.Event): void {
  const value = (event.target as globalThis.HTMLSelectElement).value;
  cursorHistory.value = [];
  void router.replace({ path: '/customers', query: queryFromRoute(value || undefined, sort.value, undefined) });
}

function updateSort(event: globalThis.Event): void {
  const value = (event.target as globalThis.HTMLSelectElement).value;
  cursorHistory.value = [];
  void router.replace({ path: '/customers', query: queryFromRoute(status.value, value || undefined, undefined) });
}

function nextPage(): void {
  const nextCursor = customersQuery.data.value?.page.nextCursor;
  if (nextCursor) {
    rememberCursor(cursorHistory.value, cursor.value);
    void router.replace({ path: '/customers', query: queryFromRoute(status.value, sort.value, nextCursor) });
  }
}

function previousPage(): void {
  const previous = cursorHistory.value.pop();
  if (cursor.value !== undefined && previous !== undefined) void router.replace({ path: '/customers', query: queryFromRoute(status.value, sort.value, previous) });
  else if (cursor.value !== undefined) void router.replace({ path: '/customers', query: queryFromRoute(status.value, sort.value, undefined) });
}

function retry(): void {
  void customersQuery.refetch();
}
</script>

<template>
  <div class="page domain-page">
    <section class="page-intro domain-page__intro">
      <div>
        <p class="eyebrow">
          客户关系
        </p>
        <h1>客户</h1>
        <p>把客户档案、审批职责和业务范围放在同一处；页面只展示服务端明确返回的字段。</p>
      </div>
      <RouterLink
        v-if="canUsePageCapability(api, 'customer.create')"
        class="button"
        to="/customers/new"
      >
        新建客户
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
      aria-label="客户列表筛选"
    >
      <label for="customer-status">客户状态</label>
      <select
        id="customer-status"
        :value="status ?? ''"
        @change="updateStatus"
      >
        <option value="">
          全部状态
        </option>
        <option value="DRAFT">
          草稿
        </option>
        <option value="PENDING_APPROVAL">
          待审核
        </option>
        <option value="APPROVED">
          已通过
        </option>
        <option value="INACTIVE">
          已停用
        </option>
      </select>
      <label for="customer-sort">排序</label>
      <select
        id="customer-sort"
        :value="sort ?? ''"
        @change="updateSort"
      >
        <option value="">
          默认排序
        </option>
        <option value="-updatedAt,-id">
          最近更新
        </option>
        <option value="name">
          名称升序
        </option>
        <option value="-name">
          名称降序
        </option>
      </select>
    </section>

    <PageState
      v-if="state !== 'ready' && state !== 'empty'"
      :state="state"
      :heading="stateCopy.heading"
      :message="stateCopy.message"
      :request-id="problemRequestId(customersQuery.error.value)"
      action-label="重新加载"
      @action="retry"
    />
    <DataTable
      v-else
      :rows="rows"
      :columns="columns"
      row-key="id"
      aria-label="客户列表"
      :state="state === 'empty' ? 'empty' : 'ready'"
      @retry="retry"
    >
      <template #cell-name="{ row }">
        <RouterLink :to="`/customers/${row.id}`">
          {{ typeof row.name === 'string' ? row.name : '未授权字段' }}
        </RouterLink>
      </template>
      <template #cell-status="{ row }">
        {{ displayStatus(String(row.status)) }}
      </template>
      <template #cell-ownerUserId="{ row }">
        {{ row.ownerUserId ? String(row.ownerUserId) : '未提供' }}
      </template>
      <template #actions="{ row }">
        <RouterLink
          class="button button--quiet button--compact"
          :to="`/customers/${row.id}`"
        >
          查看详情并执行
        </RouterLink>
      </template>
    </DataTable>
    <nav
      v-if="state === 'ready'"
      class="cursor-pager"
      aria-label="客户列表分页"
    >
      <button
        class="button button--quiet"
        type="button"
        :disabled="cursor === undefined || cursorHistory.length === 0"
        @click="previousPage"
      >
        上一页
      </button>
      <button
        class="button button--quiet"
        type="button"
        :disabled="!hasNext"
        @click="nextPage"
      >
        下一页
      </button>
    </nav>
  </div>
</template>
