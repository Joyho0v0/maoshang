<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import FormErrorSummary from '../ui/FormErrorSummary.vue';
import PageState from '../ui/PageState.vue';
import type { CustomerCreateInput, CustomerUpdateInput } from '../core/domain-api';
import { etagFor, listState, pageStateMessage, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

interface FormError {
  readonly field: string;
  readonly message: string;
}

const route = useRoute();
const router = useRouter();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id));
const isEdit = computed(() => id.value !== undefined);
const customerQuery = useQuery({
  queryKey: computed(() => ['customer', id.value]),
  queryFn: () => api.getCustomer(id.value ?? ''),
  enabled: computed(() => isEdit.value),
});
const isSaving = computed(() => saveMutation.isPending.value);
const name = ref('');
const ownerUserId = ref('00000000-0000-4000-8000-000000000002');
const errors = ref<FormError[]>([]);
const feedback = ref('');
watch(() => customerQuery.data.value?.data, (customer) => {
  if (!customer) return;
  name.value = customer.name ?? '';
  ownerUserId.value = customer.ownerUserId ?? '';
}, { immediate: true });

const state = computed(() => isEdit.value
  ? listState(customerQuery.isPending.value, customerQuery.data.value ? 1 : 0, customerQuery.error.value)
  : 'ready');
const stateCopy = computed(() => pageStateMessage(state.value));
const saveMutation = useMutation({
  mutationFn: async () => {
    if (isEdit.value && customerQuery.data.value) {
      const input: CustomerUpdateInput = {
        ...(name.value ? { name: name.value } : {}),
        ...(ownerUserId.value ? { ownerUserId: ownerUserId.value } : {}),
      };
      return api.updateCustomer(customerQuery.data.value.data.id, input, etagFor(customerQuery.data.value.data.version));
    }
    const input: CustomerCreateInput = { name: name.value, ownerUserId: ownerUserId.value };
    return api.createCustomer(input);
  },
  onSuccess: async (result) => {
    await queryClient.invalidateQueries({ queryKey: ['customers'] });
    if (result.data?.id) await router.push(`/customers/${result.data.id}`);
  },
  onError: () => { feedback.value = '保存没有完成，请检查服务端返回。'; },
});

function submit(): void {
  errors.value = [];
  if (name.value.trim().length === 0) errors.value.push({ field: 'customer-name', message: '请填写客户名称。' });
  if (!isEdit.value && ownerUserId.value.trim().length === 0) errors.value.push({ field: 'customer-owner', message: '请填写负责人。' });
  if (errors.value.length > 0) return;
  feedback.value = '';
  saveMutation.mutate();
}

function retry(): void {
  void customerQuery.refetch();
}
</script>

<template>
  <div class="page domain-page form-page">
    <RouterLink
      class="back-link"
      to="/customers"
    >
      ← 返回客户列表
    </RouterLink>
    <PageState
      v-if="state !== 'ready'"
      :state="state"
      :heading="stateCopy.heading"
      :message="stateCopy.message"
      :request-id="problemRequestId(customerQuery.error.value)"
      action-label="重新加载"
      @action="retry"
    />
    <template v-else>
      <p class="eyebrow">
        客户档案
      </p>
      <h1>{{ isEdit ? '编辑客户' : '新建客户' }}</h1>
      <p class="form-intro">
        联系人等字段只在服务端返回且当前身份有权限时展示；本表单不会把敏感字段写入 URL。
      </p>
      <FormErrorSummary :errors="errors" />
      <form
        class="domain-form"
        @submit.prevent="submit"
      >
        <label for="customer-name">客户名称</label>
        <input
          id="customer-name"
          v-model="name"
          name="name"
          autocomplete="organization"
          :aria-invalid="errors.some((error) => error.field === 'customer-name')"
        >
        <label for="customer-owner">负责人 UUID</label>
        <input
          id="customer-owner"
          v-model="ownerUserId"
          name="ownerUserId"
          autocomplete="off"
          :aria-invalid="errors.some((error) => error.field === 'customer-owner')"
        >
        <div class="form-actions">
          <RouterLink
            class="button button--quiet"
            to="/customers"
          >
            取消
          </RouterLink>
          <button
            class="button"
            type="submit"
            :disabled="isSaving"
          >
            保存客户
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
