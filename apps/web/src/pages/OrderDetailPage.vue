<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute } from 'vue-router';

import type { DomainMutationResult, OrderCommandInput, PendingMutation } from '../core/domain-api';
import { isConflictError } from '../core/domain-api';
import CapabilityGate from '../ui/CapabilityGate.vue';
import ConflictDialog from '../ui/ConflictDialog.vue';
import MoneyText from '../ui/MoneyText.vue';
import PageState from '../ui/PageState.vue';
import QuantityText from '../ui/QuantityText.vue';
import { asDecimalString } from '../core/formatters';
import { canUsePageCapability, listState, pageStateMessage, pendingRecoveryFeedback, problemCurrentEtag, problemCurrentVersion, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

const route = useRoute();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id) ?? '');
const orderQuery = useQuery({ queryKey: computed(() => ['order', id.value]), queryFn: () => api.getOrder(id.value), enabled: computed(() => id.value.length > 0) });
const order = computed(() => orderQuery.data.value?.data);
const state = computed(() => listState(orderQuery.isPending.value, order.value ? 1 : 0, orderQuery.error.value));
const copy = computed(() => pageStateMessage(state.value));
const conflictOpen = ref(false);
const feedback = ref('');
const pendingFeedback = ref('');
const pendingResult = ref<PendingMutation<unknown>>();
const transitionMutation = useMutation({
  mutationFn: (action: string): Promise<DomainMutationResult<unknown>> => {
    if (!order.value) throw new Error('Order is not loaded.');
    const etag = orderQuery.data.value?.etag;
    if (!etag) throw new Error('缺少服务端 ETag，请先刷新页面。');
    const input: OrderCommandInput = { action };
    return api.transitionOrder(order.value.id, input, etag);
  },
  onSuccess: (result) => complete(result),
  onError: (error) => {
    feedback.value = isConflictError(error) ? '订单内容已变化，请刷新后重做。' : '阶段动作没有完成。';
    if (isConflictError(error)) conflictOpen.value = true;
  },
});
const isTransitioning = computed(() => transitionMutation.isPending.value);

function hasTransition(action: string): boolean { return order.value?.allowedTransitions?.includes(action) ?? false; }
function transition(action: string): void {
  if (!orderQuery.data.value?.etag || !hasTransition(action)) return;
  transitionMutation.mutate(action);
}
function retry(): void { void orderQuery.refetch(); }
function decimal(value: string) { return asDecimalString(value); }

async function complete<T>(result: DomainMutationResult<T>): Promise<void> {
  let current = result;
  if (current.kind === 'pending') {
    pendingResult.value = current;
    pendingFeedback.value = '请求已提交，正在确认服务端结果；请勿重复提交。';
  }
  try {
    while (current.kind === 'pending') {
      current = await current.recover();
      if (current.kind === 'pending') pendingResult.value = current;
    }
    pendingResult.value = undefined;
    pendingFeedback.value = '';
    await queryClient.invalidateQueries({ queryKey: ['order', id.value] });
    await orderQuery.refetch();
  } catch (error) {
    const recovery = pendingRecoveryFeedback(error);
    if (recovery.stable) pendingResult.value = undefined;
    pendingFeedback.value = recovery.message;
  }
}

function recoverPending(): void {
  const pending = pendingResult.value;
  if (!pending || isTransitioning.value) return;
  void complete(pending);
}
</script>

<template>
  <div class="page domain-page">
    <RouterLink
      class="back-link"
      to="/orders"
    >
      ← 返回订单列表
    </RouterLink>
    <PageState
      v-if="state !== 'ready'"
      :state="state"
      :heading="copy.heading"
      :message="copy.message"
      :request-id="problemRequestId(orderQuery.error.value)"
      action-label="重新加载"
      @action="retry"
    />
    <template v-else-if="order">
      <section class="page-intro domain-page__intro">
        <div>
          <p class="eyebrow">
            订单详情 · {{ order.status }}
          </p>
          <h1>{{ order.orderNo }}</h1>
          <p>客户 {{ order.customerId }} · {{ order.currency }}</p>
        </div>
        <RouterLink
          v-if="canUsePageCapability(api, 'order.update')"
          class="button button--quiet"
          :to="`/orders/${order.id}/edit`"
        >
          编辑订单
        </RouterLink>
      </section>
      <section
        class="command-panel"
        aria-label="订单阶段动作"
      >
        <h2>当前可用动作</h2>
        <p class="muted-copy">
          动作集合来自本次响应的 allowedTransitions；页面不会按角色名或本地状态猜测。
        </p>
        <div class="command-actions">
          <CapabilityGate
            :capabilities="api.capabilities ?? []"
            capability="order.transition"
            display="disable"
            reason="当前身份不能执行订单阶段动作。"
          >
            <template #default="slotProps">
              <button
                v-if="hasTransition('CONFIRM')"
                class="button"
                type="button"
                data-testid="order-transition-CONFIRM"
                :disabled="slotProps.disabled || isTransitioning || !orderQuery.data.value?.etag"
                @click="transition('CONFIRM')"
              >
                确认订单
              </button>
              <button
                v-if="hasTransition('FULFILL')"
                class="button"
                type="button"
                data-testid="order-transition-FULFILL"
                :disabled="slotProps.disabled || isTransitioning || !orderQuery.data.value?.etag"
                @click="transition('FULFILL')"
              >
                标记履约
              </button>
              <button
                v-if="hasTransition('CANCEL')"
                class="button button--quiet"
                type="button"
                data-testid="order-transition-CANCEL"
                :disabled="slotProps.disabled || isTransitioning || !orderQuery.data.value?.etag"
                @click="transition('CANCEL')"
              >
                取消订单
              </button>
              <span
                v-if="order.allowedTransitions?.length === 0"
                class="muted-action"
              >当前阶段没有可用动作</span>
            </template>
          </CapabilityGate>
        </div>
        <p
          v-if="!orderQuery.data.value?.etag"
          class="muted-copy"
        >
          服务端未返回 ETag，阶段动作已禁用，请刷新后重试。
        </p>
        <p
          v-if="feedback || pendingFeedback"
          class="inline-error"
          role="alert"
        >
          {{ feedback || pendingFeedback }}
        </p>
        <button
          v-if="pendingResult"
          class="button button--quiet"
          type="button"
          data-testid="recover-pending"
          :disabled="isTransitioning"
          @click="recoverPending"
        >
          继续确认结果
        </button>
      </section>
      <section class="detail-card order-lines-card">
        <h2>明细快照</h2>
        <div class="table-scroll">
          <table aria-label="订单明细快照">
            <thead>
              <tr>
                <th scope="col">
                  SKU
                </th><th scope="col">
                  数量
                </th><th scope="col">
                  保存单价
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in order.lines"
                :key="line.skuId"
              >
                <td>{{ order.itemSnapshots?.find((snapshot) => snapshot.skuId === line.skuId)?.skuName ?? line.skuId }}</td>
                <td>
                  <QuantityText
                    :value="decimal(line.quantity)"
                    unit="件"
                  />
                </td>
                <td>
                  <MoneyText
                    :value="decimal(line.unitPrice)"
                    :currency="order.currency"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          class="order-total"
          data-testid="order-total"
        >
          权威总额：<MoneyText
            :value="decimal(order.totalAmount)"
            :currency="order.currency"
          />
        </p>
      </section>
      <section class="detail-card">
        <h2>阶段历史</h2>
        <ol class="history-list">
          <li
            v-for="entry in order.history ?? []"
            :key="`${entry.at}-${entry.action}`"
          >
            {{ entry.action }} · {{ entry.status }} · {{ entry.at }}
          </li>
        </ol>
      </section>
    </template>
    <ConflictDialog
      :open="conflictOpen"
      :current-version="problemCurrentVersion(transitionMutation.error.value)"
      :current-etag="problemCurrentEtag(transitionMutation.error.value)"
      :request-id="problemRequestId(transitionMutation.error.value)"
      @close="conflictOpen = false"
      @refresh="conflictOpen = false; void orderQuery.refetch()"
    />
  </div>
</template>
