<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import FormErrorSummary from '../ui/FormErrorSummary.vue';
import type { Product, ProductCreateInput, ProductUpdateInput, ResourceResult, Sku, SkuCreateInput, SkuUpdateInput } from '../core/domain-api';
import { asDecimalString } from '../core/formatters';
import { listState, pageStateMessage, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

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
const isSaving = computed(() => saveMutation.isPending.value);
const name = ref('');
const code = ref('');
const unit = ref('件');
const productId = ref('00000000-0000-4000-8000-000000000201');
const price = ref('');
const description = ref('');
const errors = ref<FormError[]>([]);
const feedback = ref('');
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
  mutationFn: async () => {
    if (isSku.value) {
      if (isEdit.value && itemQuery.data.value?.data) {
        const input: SkuUpdateInput = { ...(name.value ? { name: name.value } : {}), ...(unit.value ? { unit: unit.value } : {}), ...(price.value ? { price: asDecimalString(price.value) } : {}) };
        return api.updateSku(itemQuery.data.value.data.id, input, `"v${itemQuery.data.value.data.version}"`);
      }
      const input: SkuCreateInput = { productId: productId.value, skuCode: code.value, name: name.value, unit: unit.value, ...(price.value ? { price: asDecimalString(price.value) } : {}) };
      return api.createSku(input);
    }
    if (isEdit.value && itemQuery.data.value?.data) {
      const input: ProductUpdateInput = { ...(name.value ? { name: name.value } : {}), ...(unit.value ? { unit: unit.value } : {}), ...(description.value ? { description: description.value } : {}) };
      return api.updateProduct(itemQuery.data.value.data.id, input, `"v${itemQuery.data.value.data.version}"`);
    }
    const input: ProductCreateInput = { name: name.value, productCode: code.value, unit: unit.value, ...(description.value ? { description: description.value } : {}) };
    return api.createProduct(input);
  },
  onSuccess: async (result) => {
    await queryClient.invalidateQueries({ queryKey: ['catalog'] });
    await router.push(`/catalog/${isSku.value ? 'skus' : 'products'}/${result.data.id}`);
  },
  onError: () => { feedback.value = '保存没有完成，请检查字段与服务端返回。'; },
});

function submit(): void {
  errors.value = [];
  if (!name.value.trim()) errors.value.push({ field: 'catalog-name', message: '请填写名称。' });
  if (!code.value.trim()) errors.value.push({ field: 'catalog-code', message: `请填写${isSku.value ? 'SKU' : '商品'}编码。` });
  if (!unit.value.trim()) errors.value.push({ field: 'catalog-unit', message: '请填写单位。' });
  if (isSku.value && price.value && !/^(-?\d+)(\.\d+)?$/.test(price.value)) errors.value.push({ field: 'catalog-price', message: '价格必须是 DecimalString。' });
  if (errors.value.length === 0) saveMutation.mutate();
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
        <label for="catalog-name">名称</label><input
          id="catalog-name"
          v-model="name"
        >
        <label for="catalog-code">{{ isSku ? 'SKU 编码' : '商品编码' }}</label><input
          id="catalog-code"
          v-model="code"
        >
        <label
          v-if="isSku"
          for="catalog-product"
        >商品 UUID</label><input
          v-if="isSku"
          id="catalog-product"
          v-model="productId"
        >
        <label for="catalog-unit">单位</label><input
          id="catalog-unit"
          v-model="unit"
        >
        <label
          v-if="isSku"
          for="catalog-price"
        >价格（DecimalString）</label><input
          v-if="isSku"
          id="catalog-price"
          v-model="price"
          inputmode="decimal"
        >
        <template v-else>
          <label for="catalog-description">说明</label><textarea
            id="catalog-description"
            v-model="description"
            rows="4"
          />
        </template>
        <div class="form-actions">
          <RouterLink
            class="button button--quiet"
            to="/catalog"
          >
            取消
          </RouterLink><button
            class="button"
            type="submit"
            :disabled="isSaving"
          >
            保存
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
