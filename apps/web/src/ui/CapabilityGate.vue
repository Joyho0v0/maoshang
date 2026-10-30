<script setup lang="ts">
import { computed } from 'vue';

import { canUseCapability } from '../core/capabilities';
import { createUiId } from './focus-management';

interface Props {
  capabilities: readonly string[];
  capability?: string | readonly string[];
  mode?: 'all' | 'any';
  allowedTransitions?: readonly string[];
  transition?: string;
  display?: 'hide' | 'disable';
  reason?: string;
}

const props = withDefaults(defineProps<Props>(), {
  capability: '',
  mode: 'all',
  allowedTransitions: () => [],
  transition: '',
  display: 'hide',
  reason: '当前身份或资源状态不允许此操作。',
});
const allowed = computed(() => canUseCapability({
  capabilities: props.capabilities,
  ...(props.capability.length > 0 ? { required: props.capability } : {}),
  mode: props.mode,
  allowedTransitions: props.allowedTransitions,
  ...(props.transition.length > 0 ? { transition: props.transition } : {}),
}));
const reasonId = createUiId('capability-reason');
</script>

<template>
  <slot v-if="allowed" />
  <span
    v-else-if="display === 'disable'"
    class="capability-gate capability-gate--disabled"
    role="group"
    aria-disabled="true"
    :aria-describedby="reasonId"
  >
    <slot
      :disabled="true"
      :reason-id="reasonId"
      :reason="reason"
    />
    <span
      :id="reasonId"
      class="capability-gate__reason"
      role="note"
    >
      {{ reason }}
    </span>
  </span>
  <slot
    v-else
    name="forbidden"
  >
    <span class="capability-gate__fallback">当前身份无权执行此操作。</span>
  </slot>
</template>
