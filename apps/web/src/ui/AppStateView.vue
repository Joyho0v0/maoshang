<script setup lang="ts">
import { computed } from 'vue';

type State = 'loading' | 'error' | 'empty' | 'forbidden' | 'offline';
type HeadingLevel = 1 | 2 | 3;

interface Props {
  state: State;
  heading: string;
  message: string;
  actionLabel?: string;
  headingLevel?: HeadingLevel;
}

const props = withDefaults(defineProps<Props>(), {
  actionLabel: '',
  headingLevel: 2,
});
const emit = defineEmits<{ action: [] }>();
const headingTag = computed(() => `h${props.headingLevel}`);
const isAlert = computed(() => ['error', 'forbidden', 'offline'].includes(props.state));
const liveRole = computed(() => isAlert.value ? 'alert' : 'status');
const livePoliteness = computed(() => isAlert.value ? 'assertive' : 'polite');
const stateLabel = computed(() => ({
  loading: '正在同步',
  error: '需要处理',
  empty: '等待下一步',
  forbidden: '访问受限',
  offline: '连接中断',
}[props.state]));
</script>

<template>
  <section
    class="state-panel"
    :class="`state-panel--${state}`"
    :role="liveRole"
    :aria-live="livePoliteness"
  >
    <span
      class="state-panel__marker"
      aria-hidden="true"
    />
    <div>
      <p class="eyebrow">
        {{ stateLabel }}
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
      <button
        v-if="actionLabel"
        class="button button--quiet"
        type="button"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </section>
</template>
