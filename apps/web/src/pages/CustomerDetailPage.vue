<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RouterLink, useRoute } from 'vue-router';

import type { CustomerCommandInput, DomainMutationResult, PendingMutation } from '../core/domain-api';
import { isConflictError } from '../core/domain-api';
import CapabilityGate from '../ui/CapabilityGate.vue';
import ConflictDialog from '../ui/ConflictDialog.vue';
import Dialog from '../ui/Dialog.vue';
import PageState from '../ui/PageState.vue';
import { formErrorId } from '../ui/form-error';
import { canUsePageCapability, listState, pageStateMessage, pendingRecoveryFeedback, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

const route = useRoute();
const api = useDomainApi();
const queryClient = useQueryClient();
const id = computed(() => routeString(route.params.id) ?? '');
const customerQuery = useQuery({
  queryKey: computed(() => ['customer', id.value]),
  queryFn: () => api.getCustomer(id.value),
  enabled: computed(() => id.value.length > 0),
});
const customer = computed(() => customerQuery.data.value?.data);
const state = computed(() => listState(customerQuery.isPending.value, customer.value ? 1 : 0, customerQuery.error.value));
const stateCopy = computed(() => pageStateMessage(state.value));
const conflictOpen = ref(false);
const commandError = ref('');
const pendingFeedback = ref('');
const pendingResult = ref<PendingMutation<unknown>>();
const dialogMode = ref<'reject' | 'reassign' | undefined>();
const reason = ref('');
const assigneeUserId = ref('');
const dialogError = ref('');
const commandMutation = useMutation({
  mutationFn: (input: CustomerCommandInput): Promise<DomainMutationResult<unknown>> => {
    if (!customer.value) throw new Error('Customer is not loaded.');
    const etag = customerQuery.data.value?.etag;
    if (!etag) throw new Error('缺少服务端 ETag，请先刷新页面。');
    return api.commandCustomer(customer.value.id, input, etag);
  },
  onSuccess: (result) => complete(result),
  onError: (error) => {
    commandError.value = isConflictError(error) ? '内容已变化，请刷新后重做。' : '操作没有完成，请检查服务端返回。';
    if (isConflictError(error)) conflictOpen.value = true;
  },
});
const isCommandPending = computed(() => commandMutation.isPending.value);

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
    dialogMode.value = undefined;
    await queryClient.invalidateQueries({ queryKey: ['customer', id.value] });
    await customerQuery.refetch();
  } catch (error) {
    const recovery = pendingRecoveryFeedback(error);
    if (recovery.stable) pendingResult.value = undefined;
    pendingFeedback.value = recovery.message;
  }
}

function hasTransition(action: string): boolean { return customer.value?.allowedTransitions?.includes(action) ?? false; }
function hasEtag(): boolean { return Boolean(customerQuery.data.value?.etag); }

function execute(action: CustomerCommandInput['action']): void {
  if (!hasEtag() || !hasTransition(action)) return;
  if (action === 'REJECT') {
    dialogMode.value = 'reject';
    reason.value = '';
    dialogError.value = '';
    return;
  }
  if (action === 'REASSIGN') {
    dialogMode.value = 'reassign';
    assigneeUserId.value = '';
    dialogError.value = '';
    return;
  }
  commandMutation.mutate({ action });
}

function submitDialog(): void {
  if (dialogMode.value === 'reject') {
    if (!reason.value.trim()) { dialogError.value = '请填写驳回原因。'; return; }
    commandMutation.mutate({ action: 'REJECT', reason: reason.value.trim() });
    return;
  }
  if (dialogMode.value === 'reassign') {
    if (!assigneeUserId.value.trim()) { dialogError.value = '请选择新的负责人。'; return; }
    if (assigneeUserId.value === customer.value?.ownerUserId) { dialogError.value = '交接负责人必须不同于当前负责人。'; return; }
    commandMutation.mutate({ action: 'REASSIGN', assigneeUserId: assigneeUserId.value.trim() });
  }
}

function recoverPending(): void {
  const pending = pendingResult.value;
  if (!pending || isCommandPending.value) return;
  void complete(pending);
}

function retry(): void { void customerQuery.refetch(); }
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
          v-if="canUsePageCapability(api, 'customer.update')"
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
          操作按钮同时受 capabilities、allowedTransitions 和服务端 ETag 约束；列表页不直接创建命令意图。
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
                data-testid="customer-submit-approval"
                :disabled="slotProps.disabled || !hasTransition('SUBMIT_APPROVAL') || !hasEtag() || isCommandPending"
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
                data-testid="customer-approve"
                :disabled="slotProps.disabled || !hasTransition('APPROVE') || !hasEtag() || isCommandPending"
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
                data-testid="customer-reject"
                :disabled="slotProps.disabled || !hasTransition('REJECT') || !hasEtag() || isCommandPending"
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
                data-testid="customer-reassign"
                :disabled="slotProps.disabled || !hasTransition('REASSIGN') || !hasEtag() || isCommandPending"
                @click="execute('REASSIGN')"
              >
                交接
              </button>
            </template>
          </CapabilityGate>
        </div>
        <p
          v-if="!hasEtag()"
          class="muted-copy"
        >
          服务端未返回 ETag，写操作已禁用，请刷新后重试。
        </p>
        <p
          v-if="commandError || pendingFeedback"
          class="inline-error"
          role="alert"
        >
          {{ commandError || pendingFeedback }}
        </p>
        <button
          v-if="pendingResult"
          class="button button--quiet"
          type="button"
          data-testid="recover-pending"
          :disabled="isCommandPending"
          @click="recoverPending"
        >
          继续确认结果
        </button>
      </section>
    </template>
    <Dialog
      :open="dialogMode !== undefined"
      :title="dialogMode === 'reject' ? '驳回原因' : '选择交接负责人'"
      :busy="isCommandPending"
      @close="dialogMode = undefined"
    >
      <form
        id="customer-command-form"
        class="domain-form"
        @submit.prevent="submitDialog"
      >
        <template v-if="dialogMode === 'reject'">
          <label for="customer-reject-reason">驳回原因</label>
          <textarea
            id="customer-reject-reason"
            v-model="reason"
            name="reason"
            autocomplete="off"
            rows="4"
            :aria-invalid="Boolean(dialogError)"
            :aria-describedby="dialogError ? formErrorId('customer-reject-reason') : undefined"
          />
        </template>
        <template v-else>
          <label for="customer-reassign-assignee">新负责人 UUID</label>
          <input
            id="customer-reassign-assignee"
            v-model="assigneeUserId"
            name="assigneeUserId"
            autocomplete="off"
            :aria-invalid="Boolean(dialogError)"
            :aria-describedby="dialogError ? formErrorId('customer-reassign-assignee') : undefined"
          >
        </template>
        <p
          v-if="dialogError"
          :id="formErrorId(dialogMode === 'reject' ? 'customer-reject-reason' : 'customer-reassign-assignee')"
          class="inline-error"
          role="alert"
        >
          {{ dialogError }}
        </p>
      </form>
      <template #actions>
        <button
          class="button"
          type="submit"
          form="customer-command-form"
        >
          提交
        </button>
      </template>
    </Dialog>
    <ConflictDialog
      :open="conflictOpen"
      :current-version="customerQuery.data.value?.data.version ?? 0"
      :current-etag="customerQuery.data.value?.etag ?? ''"
      :request-id="problemRequestId(commandMutation.error.value)"
      @close="conflictOpen = false"
      @refresh="conflictOpen = false; void customerQuery.refetch()"
    />
  </div>
</template>
