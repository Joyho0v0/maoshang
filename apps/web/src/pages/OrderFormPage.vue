<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import FormErrorSummary from '../ui/FormErrorSummary.vue';
import type { OrderCreateInput, OrderUpdateInput } from '../core/domain-api';
import { asDecimalString } from '../core/formatters';
import { listState, pageStateMessage, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

interface FormError { readonly field: string; readonly message: string }
const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id));
const isEdit = computed(() => id.value !== undefined);
const orderQuery = useQuery({ queryKey: computed(() => ['order', id.value]), queryFn: () => api.getOrder(id.value ?? ''), enabled: computed(() => isEdit.value) });
const customerId = ref('00000000-0000-4000-8000-000000000101');
const orderNo = ref('SO-NEW');
const currency = ref('CNY');
const skuId = ref('00000000-0000-4000-8000-000000000301');
const quantity = ref('1.000');
const unitPrice = ref('0.00');
const note = ref('');
const errors = ref<FormError[]>([]);
const feedback = ref('');
watch(() => orderQuery.data.value?.data, (order) => {
  if (!order) return;
  customerId.value = order.customerId;
  orderNo.value = order.orderNo;
  currency.value = order.currency;
  const line = order.lines[0];
  if (line) { skuId.value = line.skuId; quantity.value = line.quantity; unitPrice.value = line.unitPrice; }
}, { immediate: true });
const state = computed(() => isEdit.value ? listState(orderQuery.isPending.value, orderQuery.data.value ? 1 : 0, orderQuery.error.value) : 'ready');
const copy = computed(() => pageStateMessage(state.value));
const saveMutation = useMutation({
  mutationFn: async () => {
    if (isEdit.value && orderQuery.data.value) {
      const input: OrderUpdateInput = { ...(note.value ? { metadata: { note: note.value } } : { metadata: {} }) };
      return api.updateOrder(orderQuery.data.value.data.id, input, `"v${orderQuery.data.value.data.version}"`);
    }
    const input: OrderCreateInput = { customerId: customerId.value, orderNo: orderNo.value, currency: currency.value, lines: [{ skuId: skuId.value, quantity: asDecimalString(quantity.value), unitPrice: asDecimalString(unitPrice.value) }] };
    return api.createOrder(input);
  },
  onSuccess: async (result) => {
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    await router.push(`/orders/${result.data.id}`);
  },
  onError: () => { feedback.value = '保存没有完成，请检查字段与服务端返回。'; },
});
const isSaving = computed(() => saveMutation.isPending.value);

function submit(): void {
  errors.value = [];
  if (!orderNo.value.trim()) errors.value.push({ field: 'order-no', message: '请填写订单号。' });
  if (!isEdit.value && !/^(-?\d+)(\.\d+)?$/.test(quantity.value)) errors.value.push({ field: 'order-quantity', message: '数量必须是 DecimalString。' });
  if (!isEdit.value && !/^(-?\d+)(\.\d+)?$/.test(unitPrice.value)) errors.value.push({ field: 'order-unit-price', message: '单价必须是 DecimalString。' });
  if (errors.value.length === 0) saveMutation.mutate();
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
      </p><h1>{{ isEdit ? '编辑订单' : '新建订单' }}</h1>
      <p class="form-intro">
        金额不会在浏览器重算；创建后展示服务端返回的 totalAmount 与保存快照。订单阶段只能通过 allowedTransitions 的动作变化。
      </p>
      <FormErrorSummary :errors="errors" />
      <form
        class="domain-form"
        @submit.prevent="submit"
      >
        <label for="order-no">订单号</label><input
          id="order-no"
          v-model="orderNo"
        >
        <template v-if="!isEdit">
          <label for="order-customer">客户 UUID</label><input
            id="order-customer"
            v-model="customerId"
          >
          <label for="order-sku">SKU UUID</label><input
            id="order-sku"
            v-model="skuId"
          >
          <label for="order-quantity">数量（DecimalString）</label><input
            id="order-quantity"
            v-model="quantity"
            inputmode="decimal"
          >
          <label for="order-unit-price">保存单价（DecimalString）</label><input
            id="order-unit-price"
            v-model="unitPrice"
            inputmode="decimal"
          >
        </template>
        <template v-else>
          <label for="order-note">内部备注</label><textarea
            id="order-note"
            v-model="note"
            rows="4"
          />
        </template>
        <div class="form-actions">
          <RouterLink
            class="button button--quiet"
            to="/orders"
          >
            取消
          </RouterLink><button
            class="button"
            type="submit"
            :disabled="isSaving"
          >
            保存订单
          </button>
        </div>
        <p
          v-if="feedback"
          class="inline-error"
          role="alert"
        >
          {{ feedback }}
        </p>
      </form>
    </template>
  </div>
</template>
