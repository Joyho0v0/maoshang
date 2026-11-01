<script setup lang="ts">
import { computed } from 'vue';

type State = 'loading' | 'error' | 'empty';
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
const liveRole = computed(() => props.state === 'error' ? 'alert' : 'status');
const livePoliteness = computed(() => props.state === 'error' ? 'assertive' : 'polite');
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
        {{ state === 'loading' ? '正在同步' : state === 'error' ? '需要处理' : '等待下一步' }}
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
