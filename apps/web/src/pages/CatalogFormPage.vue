<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import type { Product, ProductCreateInput, ProductUpdateInput, DomainMutationResult, PendingMutation, ResourceResult, Sku, SkuCreateInput, SkuUpdateInput } from '../core/domain-api';
import { isConflictError } from '../core/domain-api';
import { asDecimalString } from '../core/formatters';
import ConflictDialog from '../ui/ConflictDialog.vue';
import FormErrorSummary from '../ui/FormErrorSummary.vue';
import { formErrorId } from '../ui/form-error';
import PageState from '../ui/PageState.vue';
import { listState, pageStateMessage, pendingRecoveryFeedback, problemCurrentEtag, problemCurrentVersion, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

interface FormError { readonly field: string; readonly message: string }

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const queryClient = useQueryClient();
const isSku = computed(() => route.path.includes('/skus/'));
const id = computed(() => routeString(route.params.id));
const isEdit = computed(() => id.value !== undefined);
const itemQuery = useQuery<ResourceResult<Product> | ResourceResult<Sku>>({
  queryKey: computed(() => [isSku.value ? 'sku' : 'product', id.value]),
  queryFn: () => isSku.value ? api.getSku(id.value ?? '') : api.getProduct(id.value ?? ''),
  enabled: computed(() => isEdit.value),
});
const productsQuery = useQuery({
  queryKey: ['catalog-form-products'],
  queryFn: () => api.listProducts(),
  enabled: computed(() => isSku.value && !isEdit.value),
});
const name = ref('');
const code = ref('');
const unit = ref('件');
const productId = ref('');
const price = ref('');
const description = ref('');
const errors = ref<FormError[]>([]);
const feedback = ref('');
const pendingFeedback = ref('');
const pendingResult = ref<PendingMutation<unknown>>();
const conflictOpen = ref(false);
watch(() => itemQuery.data.value?.data, (item) => {
  if (!item) return;
  name.value = item.name;
  unit.value = item.unit;
  if (isSku.value) {
    const sku = item as Sku;
    code.value = sku.skuCode;
    productId.value = sku.productId;
    price.value = sku.price ?? '';
  } else {
    const product = item as Product;
    code.value = product.productCode;
    description.value = product.description ?? '';
  }
}, { immediate: true });
const state = computed(() => isEdit.value ? listState(itemQuery.isPending.value, itemQuery.data.value ? 1 : 0, itemQuery.error.value) : 'ready');
const copy = computed(() => pageStateMessage(state.value));
const saveMutation = useMutation({
  mutationFn: async (): Promise<DomainMutationResult<unknown>> => {
    if (isSku.value) {
      if (isEdit.value && itemQuery.data.value?.data) {
        const input: SkuUpdateInput = { ...(name.value ? { name: name.value } : {}), ...(unit.value ? { unit: unit.value } : {}), ...(price.value ? { price: asDecimalString(price.value) } : {}) };
        const etag = itemQuery.data.value.etag;
        if (!etag) throw new Error('缺少服务端 ETag，请先刷新页面。');
        return api.updateSku(itemQuery.data.value.data.id, input, etag);
      }
      const input: SkuCreateInput = { productId: productId.value, skuCode: code.value, name: name.value, unit: unit.value, ...(price.value ? { price: asDecimalString(price.value) } : {}) };
      return api.createSku(input);
    }
    if (isEdit.value && itemQuery.data.value?.data) {
      const input: ProductUpdateInput = { ...(name.value ? { name: name.value } : {}), ...(unit.value ? { unit: unit.value } : {}), ...(description.value ? { description: description.value } : {}) };
      const etag = itemQuery.data.value.etag;
      if (!etag) throw new Error('缺少服务端 ETag，请先刷新页面。');
      return api.updateProduct(itemQuery.data.value.data.id, input, etag);
    }
    const input: ProductCreateInput = { name: name.value, productCode: code.value, unit: unit.value, ...(description.value ? { description: description.value } : {}) };
    return api.createProduct(input);
  },
  onSuccess: (result) => complete(result),
  onError: (error) => {
    feedback.value = isConflictError(error) ? '内容已变化，请刷新后重做。' : '保存没有完成，请检查字段与服务端返回。';
    if (isConflictError(error)) conflictOpen.value = true;
  },
});
const isSaving = computed(() => saveMutation.isPending.value);
const canSave = computed(() => !isSaving.value && (!isEdit.value || Boolean(itemQuery.data.value?.etag)));

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
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
    const resource = current.data as T & { id?: string };
    if (resource.id) await router.push(`/catalog/${isSku.value ? 'skus' : 'products'}/${resource.id}`);
  } catch (error) {
    const recovery = pendingRecoveryFeedback(error);
    if (recovery.stable) pendingResult.value = undefined;
    pendingFeedback.value = recovery.message;
  }
}

function submit(): void {
  if (!canSave.value) return;
  errors.value = [];
  if (!name.value.trim()) errors.value.push({ field: 'catalog-name', message: '请填写名称。' });
  if (!isEdit.value && !code.value.trim()) errors.value.push({ field: 'catalog-code', message: `请填写${isSku.value ? 'SKU' : '商品'}编码。` });
  if (!unit.value.trim()) errors.value.push({ field: 'catalog-unit', message: '请填写单位。' });
  if (!isEdit.value && isSku.value && !productId.value.trim()) errors.value.push({ field: 'catalog-product', message: '请选择真实商品。' });
  if (isSku.value && price.value && !/^(-?\d+)(\.\d+)?$/.test(price.value)) errors.value.push({ field: 'catalog-price', message: '价格必须是 DecimalString。' });
  if (errors.value.length === 0) saveMutation.mutate();
}

function recoverPending(): void {
  const pending = pendingResult.value;
  if (!pending || isSaving.value) return;
  void complete(pending);
}
</script>

<template>
  <div class="page domain-page form-page">
    <RouterLink
      class="back-link"
      to="/catalog"
    >
      ← 返回商品目录
    </RouterLink>
    <PageState
      v-if="state !== 'ready'"
      :state="state"
      :heading="copy.heading"
      :message="copy.message"
      :request-id="problemRequestId(itemQuery.error.value)"
      action-label="重新加载"
      @action="itemQuery.refetch"
    />
    <template v-else>
      <p class="eyebrow">
        {{ isSku ? 'SKU' : '商品' }}目录
      </p>
      <h1>{{ isEdit ? '编辑' : '新建' }}{{ isSku ? ' SKU' : '商品' }}</h1>
      <p class="form-intro">
        价格字段只接受 DecimalString；库存跟踪方式与阈值由服务端资源返回，本表单不发明本地计算。
      </p>
      <FormErrorSummary :errors="errors" />
      <form
        class="domain-form"
        @submit.prevent="submit"
      >
        <label for="catalog-name">名称</label>
        <input
          id="catalog-name"
          v-model="name"
          name="name"
          autocomplete="off"
          :aria-invalid="errors.some((error) => error.field === 'catalog-name')"
          :aria-describedby="errors.some((error) => error.field === 'catalog-name') ? formErrorId('catalog-name') : undefined"
        >
        <label for="catalog-code">{{ isSku ? 'SKU 编码' : '商品编码' }}</label>
        <input
          id="catalog-code"
          v-model="code"
          name="code"
          autocomplete="off"
          :readonly="isEdit"
          :aria-readonly="isEdit"
          :aria-invalid="errors.some((error) => error.field === 'catalog-code')"
          :aria-describedby="errors.some((error) => error.field === 'catalog-code') ? formErrorId('catalog-code') : undefined"
        >
        <template v-if="isSku">
          <label for="catalog-product">商品</label>
          <select
            v-if="!isEdit"
            id="catalog-product"
            v-model="productId"
            name="productId"
            autocomplete="off"
            :aria-invalid="errors.some((error) => error.field === 'catalog-product')"
            :aria-describedby="errors.some((error) => error.field === 'catalog-product') ? formErrorId('catalog-product') : undefined"
          >
            <option value="">
              请选择已授权商品
            </option>
            <option
              v-for="product in productsQuery.data.value?.data ?? []"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }}（{{ product.productCode }}）
            </option>
          </select>
          <input
            v-else
            id="catalog-product"
            :value="productId"
            name="productId"
            autocomplete="off"
            readonly
            aria-readonly="true"
          >
          <label for="catalog-price">价格（DecimalString）</label>
          <input
            id="catalog-price"
            v-model="price"
            name="price"
            autocomplete="off"
            inputmode="decimal"
            :aria-invalid="errors.some((error) => error.field === 'catalog-price')"
            :aria-describedby="errors.some((error) => error.field === 'catalog-price') ? formErrorId('catalog-price') : undefined"
          >
        </template>
        <label for="catalog-unit">单位</label>
        <input
          id="catalog-unit"
          v-model="unit"
          name="unit"
          autocomplete="off"
          :aria-invalid="errors.some((error) => error.field === 'catalog-unit')"
          :aria-describedby="errors.some((error) => error.field === 'catalog-unit') ? formErrorId('catalog-unit') : undefined"
        >
        <template v-if="!isSku">
          <label for="catalog-description">说明</label>
          <textarea
            id="catalog-description"
            v-model="description"
            name="description"
            autocomplete="off"
            rows="4"
          />
        </template>
        <div class="form-actions">
          <RouterLink
            class="button button--quiet"
            to="/catalog"
          >
            取消
          </RouterLink>
          <button
            class="button"
            type="submit"
            :disabled="!canSave"
          >
            保存
          </button>
        </div>
        <p
          v-if="isEdit && itemQuery.data.value && !itemQuery.data.value.etag"
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
      @refresh="conflictOpen = false; void itemQuery.refetch()"
    />
  </div>
</template>
