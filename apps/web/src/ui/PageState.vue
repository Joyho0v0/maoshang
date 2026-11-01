<script setup lang="ts">
import { computed } from 'vue';

export type PageStateKind = 'loading' | 'empty' | 'error' | 'forbidden' | 'offline';
export type PageStateHeadingLevel = 1 | 2 | 3;

interface Props {
  state: PageStateKind;
  heading: string;
  message: string;
  actionLabel?: string;
  headingLevel?: PageStateHeadingLevel;
  requestId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  actionLabel: '',
  headingLevel: 2,
  requestId: '',
});
const emit = defineEmits<{ action: [] }>();
const headingTag = computed(() => `h${props.headingLevel}`);
const isAlert = computed(() => props.state === 'error' || props.state === 'forbidden' || props.state === 'offline');
const role = computed(() => isAlert.value ? 'alert' : 'status');
const live = computed(() => isAlert.value ? 'assertive' : 'polite');
const label = computed(() => ({
  loading: '正在同步',
  empty: '等待下一步',
  error: '需要处理',
  forbidden: '访问受限',
  offline: '连接中断',
}[props.state]));
</script>

<template>
  <section
    class="state-panel"
    :class="`state-panel--${state}`"
    :role="role"
    :aria-live="live"
  >
    <span
      class="state-panel__marker"
      aria-hidden="true"
    />
    <div>
      <p class="eyebrow">
        {{ label }}
      </p>
      <component
        :is="headingTag"
        class="state-panel__heading"
      >
        {{ heading }}
      </component>
      <p class="state-panel__message">
        {{ message }}
      </p>
      <p
        v-if="requestId"
        class="state-panel__request-id"
      >
        请求编号：{{ requestId }}
      </p>
      <button
        v-if="actionLabel"
        class="button button--quiet"
        type="button"
        @click="emit('action')"
        @keydown.enter.prevent="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </section>
</template>
