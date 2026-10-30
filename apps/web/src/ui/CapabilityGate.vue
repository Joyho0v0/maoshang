<script setup lang="ts">
import { computed } from 'vue';

import { canUseCapability } from '../core/capabilities';

interface Props {
  capabilities: readonly string[];
  capability?: string | readonly string[];
  mode?: 'all' | 'any';
  allowedTransitions?: readonly string[];
  transition?: string;
}

const props = withDefaults(defineProps<Props>(), {
  capability: '',
  mode: 'all',
  allowedTransitions: () => [],
  transition: '',
});
const allowed = computed(() => canUseCapability({
  capabilities: props.capabilities,
  ...(props.capability.length > 0 ? { required: props.capability } : {}),
  mode: props.mode,
  allowedTransitions: props.allowedTransitions,
  ...(props.transition.length > 0 ? { transition: props.transition } : {}),
}));
</script>

<template>
  <slot v-if="allowed" />
  <slot
    v-else
    name="forbidden"
  >
    <span class="capability-gate__fallback">当前身份无权执行此操作。</span>
  </slot>
</template>
