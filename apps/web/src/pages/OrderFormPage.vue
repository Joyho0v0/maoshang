<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import type { Customer, DomainPageState, DomainMutationResult, OrderCreateInput, OrderUpdateInput, PendingMutation, Sku } from '../core/domain-api';
import { isConflictError } from '../core/domain-api';
import { asDecimalString } from '../core/formatters';
import ConflictDialog from '../ui/ConflictDialog.vue';
import FormErrorSummary from '../ui/FormErrorSummary.vue';
import { formErrorId } from '../ui/form-error';
import PageState from '../ui/PageState.vue';
import { listState, pageStateMessage, pendingRecoveryFeedback, problemCurrentEtag, problemCurrentVersion, problemRequestId, referenceStateMessage, routeString, useDomainApi } from './domain-page-helpers';

interface FormError { readonly field: string; readonly message: string }

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id));
const isEdit = computed(() => id.value !== undefined);
const orderQuery = useQuery({ queryKey: computed(() => ['order', id.value]), queryFn: () => api.getOrder(id.value ?? ''), enabled: computed(() => isEdit.value) });
const customerCursor = ref<string>();
const customerOptions = ref<Customer[]>([]);
const customerNextCursor = ref<string>();
const customersQuery = useQuery({
  queryKey: computed(() => ['order-form-customers', customerCursor.value]),
  queryFn: () => api.listCustomers({ cursor: customerCursor.value }),
  enabled: computed(() => !isEdit.value),
});
const skuCursor = ref<string>();
const skuOptions = ref<Sku[]>([]);
const skuNextCursor = ref<string>();
const skusQuery = useQuery({
  queryKey: computed(() => ['order-form-skus', skuCursor.value]),
  queryFn: () => api.listSkus({ cursor: skuCursor.value }),
  enabled: computed(() => !isEdit.value),
});
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
watch(() => customersQuery.data.value, (page) => {
  if (!page) return;
  const existingIds = new Set(customerOptions.value.map((customer) => customer.id));
  const incoming = page.data.filter((customer) => !existingIds.has(customer.id));
  customerOptions.value = customerCursor.value === undefined ? [...page.data] : [...customerOptions.value, ...incoming];
  customerNextCursor.value = page.page.nextCursor ?? undefined;
}, { immediate: true });
watch(() => skusQuery.data.value, (page) => {
  if (!page) return;
  const existingIds = new Set(skuOptions.value.map((sku) => sku.id));
  const incoming = page.data.filter((sku) => !existingIds.has(sku.id));
  skuOptions.value = skuCursor.value === undefined ? [...page.data] : [...skuOptions.value, ...incoming];
  skuNextCursor.value = page.page.nextCursor ?? undefined;
}, { immediate: true });
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
const customerReferenceState = computed<DomainPageState>(() => isEdit.value
  ? 'ready'
  : listState(customersQuery.isPending.value, customerOptions.value.length, customersQuery.error.value));
const skuReferenceState = computed<DomainPageState>(() => isEdit.value
  ? 'ready'
  : listState(skusQuery.isPending.value, skuOptions.value.length, skusQuery.error.value));
const customerReferenceCopy = computed(() => referenceStateMessage('客户', customerReferenceState.value));
const skuReferenceCopy = computed(() => referenceStateMessage('SKU', skuReferenceState.value));
const isLoadingCustomers = computed(() => customersQuery.isFetching.value);
const isLoadingSkus = computed(() => skusQuery.isFetching.value);
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
const canSave = computed(() => !isSaving.value
  && (!isEdit.value
    ? customerReferenceState.value === 'ready' && skuReferenceState.value === 'ready'
    : Boolean(orderQuery.data.value?.etag)));

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
  if (!canSave.value) return;
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

function retryCustomers(): void {
  void customersQuery.refetch();
}

function retrySkus(): void {
  void skusQuery.refetch();
}

function loadMoreCustomers(): void {
  if (!customerNextCursor.value || isLoadingCustomers.value) return;
  customerCursor.value = customerNextCursor.value;
}

function loadMoreSkus(): void {
  if (!skuNextCursor.value || isLoadingSkus.value) return;
  skuCursor.value = skuNextCursor.value;
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
          <label for="order-customer">客户</label>
          <div data-testid="order-customers-reference-state">
            <PageState
              v-if="customerReferenceState !== 'ready'"
              :state="customerReferenceState"
              :heading="customerReferenceCopy.heading"
              :message="customerReferenceCopy.message"
              :request-id="problemRequestId(customersQuery.error.value)"
              action-label="重新加载客户"
              @action="retryCustomers"
            />
          </div>
          <select
            id="order-customer"
            v-model="customerId"
            name="customerId"
            autocomplete="off"
            :disabled="customerReferenceState !== 'ready' || isLoadingCustomers"
            :aria-invalid="errors.some((error) => error.field === 'order-customer')"
            :aria-describedby="errors.some((error) => error.field === 'order-customer') ? formErrorId('order-customer') : undefined"
          >
            <option value="">
              请选择已授权客户
            </option>
            <option
              v-for="customer in customerOptions"
              :key="customer.id"
              :value="customer.id"
            >
              {{ customer.name ?? customer.id }}
            </option>
          </select>
          <button
            v-if="customerReferenceState === 'ready' && customerNextCursor"
            class="button button--quiet"
            type="button"
            data-testid="order-customers-load-more"
            :disabled="isLoadingCustomers"
            @click="loadMoreCustomers"
          >
            {{ isLoadingCustomers ? '正在加载客户…' : '加载更多客户' }}
          </button>
          <label for="order-sku">SKU</label>
          <div data-testid="order-skus-reference-state">
            <PageState
              v-if="skuReferenceState !== 'ready'"
              :state="skuReferenceState"
              :heading="skuReferenceCopy.heading"
              :message="skuReferenceCopy.message"
              :request-id="problemRequestId(skusQuery.error.value)"
              action-label="重新加载 SKU"
              @action="retrySkus"
            />
          </div>
          <select
            id="order-sku"
            v-model="skuId"
            name="skuId"
            autocomplete="off"
            :disabled="skuReferenceState !== 'ready' || isLoadingSkus"
            :aria-invalid="errors.some((error) => error.field === 'order-sku')"
            :aria-describedby="errors.some((error) => error.field === 'order-sku') ? formErrorId('order-sku') : undefined"
          >
            <option value="">
              请选择已授权 SKU
            </option>
            <option
              v-for="sku in skuOptions"
              :key="sku.id"
              :value="sku.id"
            >
              {{ sku.name }}（{{ sku.skuCode }}）
            </option>
          </select>
          <button
            v-if="skuReferenceState === 'ready' && skuNextCursor"
            class="button button--quiet"
            type="button"
            data-testid="order-skus-load-more"
            :disabled="isLoadingSkus"
            @click="loadMoreSkus"
          >
            {{ isLoadingSkus ? '正在加载 SKU…' : '加载更多 SKU' }}
          </button>
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
            :disabled="!canSave"
          >
            保存订单
          </button>
        </div>
        <p
          v-if="isEdit && orderQuery.data.value && !orderQuery.data.value.etag"
          class="inline-error"
          role="alert"
        >
          服务端未返回 ETag，请刷新后再保存。
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
          :disabled="isSaving"
          @click="recoverPending"
        >
          继续确认结果
        </button>
      </form>
    </template>
    <ConflictDialog
      :open="conflictOpen"
      :current-version="problemCurrentVersion(saveMutation.error.value)"
      :current-etag="problemCurrentEtag(saveMutation.error.value)"
      :request-id="problemRequestId(saveMutation.error.value)"
      @close="conflictOpen = false"
      @refresh="conflictOpen = false; void orderQuery.refetch()"
    />
  </div>
</template>
