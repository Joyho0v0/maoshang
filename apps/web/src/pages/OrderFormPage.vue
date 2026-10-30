<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import type { DomainMutationResult, OrderCreateInput, OrderUpdateInput, PendingMutation } from '../core/domain-api';
import { isConflictError } from '../core/domain-api';
import { asDecimalString } from '../core/formatters';
import ConflictDialog from '../ui/ConflictDialog.vue';
import FormErrorSummary from '../ui/FormErrorSummary.vue';
import { formErrorId } from '../ui/form-error';
import PageState from '../ui/PageState.vue';
import { listState, pageStateMessage, pendingRecoveryFeedback, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

interface FormError { readonly field: string; readonly message: string }

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id));
const isEdit = computed(() => id.value !== undefined);
const orderQuery = useQuery({ queryKey: computed(() => ['order', id.value]), queryFn: () => api.getOrder(id.value ?? ''), enabled: computed(() => isEdit.value) });
const customerId = ref('');
const orderNo = ref('');
const currency = ref('CNY');
const skuId = ref('');
const quantity = ref('');
const unitPrice = ref('');
const note = ref('');
const errors = ref<FormError[]>([]);
const feedback = ref('');
const pendingFeedback = ref('');
const pendingResult = ref<PendingMutation<unknown>>();
const conflictOpen = ref(false);
watch(() => orderQuery.data.value?.data, (order) => {
  if (!order) return;
  customerId.value = order.customerId;
  orderNo.value = order.orderNo;
  currency.value = order.currency;
  const line = order.lines[0];
  if (line) {
    skuId.value = line.skuId;
    quantity.value = line.quantity;
    unitPrice.value = line.unitPrice;
  }
  note.value = isRecord(order.metadata) && typeof order.metadata.note === 'string' ? order.metadata.note : '';
}, { immediate: true });
const state = computed(() => isEdit.value ? listState(orderQuery.isPending.value, orderQuery.data.value ? 1 : 0, orderQuery.error.value) : 'ready');
const copy = computed(() => pageStateMessage(state.value));
const saveMutation = useMutation({
  mutationFn: async (): Promise<DomainMutationResult<unknown>> => {
    if (isEdit.value && orderQuery.data.value) {
      const currentMetadata = isRecord(orderQuery.data.value.data.metadata) ? orderQuery.data.value.data.metadata : {};
      const input: OrderUpdateInput = note.value === (typeof currentMetadata.note === 'string' ? currentMetadata.note : '')
        ? {}
        : { metadata: { ...currentMetadata, note: note.value } };
      const etag = orderQuery.data.value.etag;
      if (!etag) throw new Error('缺少服务端 ETag，请先刷新页面。');
      return api.updateOrder(orderQuery.data.value.data.id, input, etag);
    }
    const input: OrderCreateInput = {
      customerId: customerId.value,
      orderNo: orderNo.value,
      currency: currency.value,
      lines: [{ skuId: skuId.value, quantity: asDecimalString(quantity.value), unitPrice: asDecimalString(unitPrice.value) }],
    };
    return api.createOrder(input);
  },
  onSuccess: (result) => complete(result),
  onError: (error) => {
    feedback.value = isConflictError(error) ? '内容已变化，请刷新后重做。' : '保存没有完成，请检查字段与服务端返回。';
    if (isConflictError(error)) conflictOpen.value = true;
  },
});
const isSaving = computed(() => saveMutation.isPending.value);

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
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    const resource = current.data as T & { id?: string };
    if (resource.id) await router.push(`/orders/${resource.id}`);
  } catch (error) {
    const recovery = pendingRecoveryFeedback(error);
    if (recovery.stable) pendingResult.value = undefined;
    pendingFeedback.value = recovery.message;
  }
}

function submit(): void {
  errors.value = [];
  if (!orderNo.value.trim()) errors.value.push({ field: 'order-no', message: '请填写订单号。' });
  if (!isEdit.value && !customerId.value.trim()) errors.value.push({ field: 'order-customer', message: '请选择真实客户。' });
  if (!isEdit.value && !skuId.value.trim()) errors.value.push({ field: 'order-sku', message: '请选择真实 SKU。' });
  if (!isEdit.value && !/^(-?\d+)(\.\d+)?$/.test(quantity.value)) errors.value.push({ field: 'order-quantity', message: '数量必须是 DecimalString。' });
  if (!isEdit.value && !/^(-?\d+)(\.\d+)?$/.test(unitPrice.value)) errors.value.push({ field: 'order-unit-price', message: '单价必须是 DecimalString。' });
  if (errors.value.length === 0) saveMutation.mutate();
}

function recoverPending(): void {
  const pending = pendingResult.value;
  if (!pending || isSaving.value) return;
  void complete(pending);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
</script>

<template>
  <div class="page domain-page form-page">
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
      @action="orderQuery.refetch"
    />
    <template v-else>
      <p class="eyebrow">
        订单
      </p>
      <h1>{{ isEdit ? '编辑订单' : '新建订单' }}</h1>
      <p class="form-intro">
        金额不会在浏览器重算；创建后展示服务端返回的 totalAmount 与保存快照。订单阶段只能通过 allowedTransitions 的动作变化。
      </p>
      <FormErrorSummary :errors="errors" />
      <form
        class="domain-form"
        @submit.prevent="submit"
      >
        <label for="order-no">订单号</label>
        <input
          id="order-no"
          v-model="orderNo"
          name="orderNo"
          autocomplete="off"
          :readonly="isEdit"
          :aria-readonly="isEdit"
          :aria-invalid="errors.some((error) => error.field === 'order-no')"
          :aria-describedby="errors.some((error) => error.field === 'order-no') ? formErrorId('order-no') : undefined"
        >
        <template v-if="!isEdit">
          <label for="order-customer">客户 UUID</label>
          <input
            id="order-customer"
            v-model="customerId"
            name="customerId"
            autocomplete="off"
            :aria-invalid="errors.some((error) => error.field === 'order-customer')"
            :aria-describedby="errors.some((error) => error.field === 'order-customer') ? formErrorId('order-customer') : undefined"
          >
          <label for="order-sku">SKU UUID</label>
          <input
            id="order-sku"
            v-model="skuId"
            name="skuId"
            autocomplete="off"
            :aria-invalid="errors.some((error) => error.field === 'order-sku')"
            :aria-describedby="errors.some((error) => error.field === 'order-sku') ? formErrorId('order-sku') : undefined"
          >
          <label for="order-quantity">数量（DecimalString）</label>
          <input
            id="order-quantity"
            v-model="quantity"
            name="quantity"
            autocomplete="off"
            inputmode="decimal"
            :aria-invalid="errors.some((error) => error.field === 'order-quantity')"
            :aria-describedby="errors.some((error) => error.field === 'order-quantity') ? formErrorId('order-quantity') : undefined"
          >
          <label for="order-unit-price">保存单价（DecimalString）</label>
          <input
            id="order-unit-price"
            v-model="unitPrice"
            name="unitPrice"
            autocomplete="off"
            inputmode="decimal"
            :aria-invalid="errors.some((error) => error.field === 'order-unit-price')"
            :aria-describedby="errors.some((error) => error.field === 'order-unit-price') ? formErrorId('order-unit-price') : undefined"
          >
        </template>
        <template v-else>
          <label for="order-note">内部备注</label>
          <textarea
            id="order-note"
            v-model="note"
            name="note"
            autocomplete="off"
            rows="4"
          />
        </template>
        <div class="form-actions">
          <RouterLink
            class="button button--quiet"
            to="/orders"
          >
            取消
          </RouterLink>
          <button
            class="button"
            type="submit"
            :disabled="isSaving"
          >
            保存订单
          </button>
        </div>
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
          :disabled="isSaving"
          @click="recoverPending"
        >
          继续确认结果
        </button>
      </form>
    </template>
    <ConflictDialog
      :open="conflictOpen"
      :current-version="orderQuery.data.value?.data.version ?? 0"
      :current-etag="orderQuery.data.value?.etag ?? ''"
      :request-id="problemRequestId(saveMutation.error.value)"
      @close="conflictOpen = false"
      @refresh="conflictOpen = false; void orderQuery.refetch()"
    />
  </div>
</template>
