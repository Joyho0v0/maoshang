<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute } from 'vue-router';

import type { CustomerCommandInput } from '../core/domain-api';
import { isConflictError } from '../core/domain-api';
import { etagFor, listState, pageStateMessage, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';
import CapabilityGate from '../ui/CapabilityGate.vue';
import ConflictDialog from '../ui/ConflictDialog.vue';
import PageState from '../ui/PageState.vue';

const route = useRoute();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id) ?? '');
const customerQuery = useQuery({
  queryKey: computed(() => ['customer', id.value]),
  queryFn: () => api.getCustomer(id.value),
  enabled: computed(() => id.value.length > 0),
});
const isCommandPending = computed(() => commandMutation.isPending.value);
const customer = computed(() => customerQuery.data.value?.data);
const state = computed(() => listState(customerQuery.isPending.value, customer.value ? 1 : 0, customerQuery.error.value));
const stateCopy = computed(() => pageStateMessage(state.value));
const conflictOpen = ref(false);
const commandError = ref('');
const commandMutation = useMutation({
  mutationFn: (action: CustomerCommandInput['action']) => {
    if (!customer.value) throw new Error('Customer is not loaded.');
    return api.commandCustomer(customer.value.id, { action }, etagFor(customer.value.version));
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', id.value] }),
  onError: (error) => {
    commandError.value = isConflictError(error) ? '内容已变化，请刷新后重做。' : '操作没有完成，请稍后重试。';
    if (isConflictError(error)) conflictOpen.value = true;
  },
});

function hasTransition(action: string): boolean {
  return customer.value?.allowedTransitions?.includes(action) ?? false;
}

function execute(action: CustomerCommandInput['action']): void {
  commandMutation.mutate(action);
}

function retry(): void {
  void customerQuery.refetch();
}
</script>

<template>
  <div class="page domain-page">
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
    <template v-else-if="customer">
      <section class="page-intro domain-page__intro">
        <div>
          <p class="eyebrow">
            客户档案 · {{ customer.status }}
          </p>
          <h1>{{ customer.name ?? '未授权字段' }}</h1>
          <p>版本 {{ customer.version }} · 审批结果由服务端的 approvalSummary 返回。</p>
        </div>
        <RouterLink
          class="button button--quiet"
          :to="`/customers/${customer.id}/edit`"
        >
          编辑档案
        </RouterLink>
      </section>

      <section
        class="detail-grid"
        aria-label="客户信息"
      >
        <article class="detail-card">
          <h2>档案范围</h2>
          <dl>
            <div><dt>状态</dt><dd>{{ customer.status }}</dd></div>
            <div><dt>负责人</dt><dd>{{ customer.ownerUserId ?? '未提供' }}</dd></div>
            <div><dt>业务组</dt><dd>{{ customer.businessGroupId ?? '未授权字段' }}</dd></div>
          </dl>
        </article>
        <article class="detail-card">
          <h2>审批摘要</h2>
          <p v-if="customer.approvalSummary">
            第 {{ customer.approvalSummary.attemptNo }} 次：{{ customer.approvalSummary.latestOutcome }}
          </p>
          <p v-if="customer.approvalSummary?.reason">
            原因：{{ customer.approvalSummary.reason }}
          </p>
          <p v-else>
            尚无审批原因。
          </p>
        </article>
      </section>

      <section
        class="command-panel"
        aria-label="客户操作"
      >
        <h2>按职责执行</h2>
        <p class="muted-copy">
          操作按钮同时受 capabilities 与 allowedTransitions 约束；角色名称不会绕过服务端授权。
        </p>
        <div class="command-actions">
          <CapabilityGate
            :capabilities="customer.capabilities"
            capability="customer.submitApproval"
            display="disable"
            reason="当前身份不能提交客户审核。"
          >
            <template #default="slotProps">
              <button
                class="button"
                type="button"
                :disabled="slotProps.disabled || !hasTransition('SUBMIT_APPROVAL') || isCommandPending"
                @click="execute('SUBMIT_APPROVAL')"
              >
                提交审核
              </button>
            </template>
          </CapabilityGate>
          <CapabilityGate
            :capabilities="customer.capabilities"
            capability="customer.approve"
            display="disable"
            reason="当前身份不能批准客户。"
          >
            <template #default="slotProps">
              <button
                class="button"
                type="button"
                :disabled="slotProps.disabled || !hasTransition('APPROVE') || isCommandPending"
                @click="execute('APPROVE')"
              >
                批准
              </button>
            </template>
          </CapabilityGate>
          <CapabilityGate
            :capabilities="customer.capabilities"
            capability="customer.reject"
            display="disable"
            reason="当前身份不能驳回客户。"
          >
            <template #default="slotProps">
              <button
                class="button button--quiet"
                type="button"
                :disabled="slotProps.disabled || !hasTransition('REJECT') || isCommandPending"
                @click="execute('REJECT')"
              >
                驳回
              </button>
            </template>
          </CapabilityGate>
          <CapabilityGate
            :capabilities="customer.capabilities"
            capability="customer.reassign"
            display="disable"
            reason="当前身份不能交接客户。"
          >
            <template #default="slotProps">
              <button
                class="button button--quiet"
                type="button"
                :disabled="slotProps.disabled || !hasTransition('REASSIGN') || isCommandPending"
                @click="execute('REASSIGN')"
              >
                交接
              </button>
            </template>
          </CapabilityGate>
        </div>
        <p
          v-if="commandError"
          class="inline-error"
          role="alert"
        >
          {{ commandError }}
        </p>
      </section>
    </template>
    <ConflictDialog
      :open="conflictOpen"
      @close="conflictOpen = false"
      @refresh="conflictOpen = false; void customerQuery.refetch()"
    />
  </div>
</template>
