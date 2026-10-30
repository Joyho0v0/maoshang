<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

interface Props {
  open: boolean;
  title: string;
  closeLabel?: string;
}

const props = withDefaults(defineProps<Props>(), { closeLabel: '关闭' });
const emit = defineEmits<{ close: [] }>();
type HtmlElement = InstanceType<typeof globalThis.HTMLElement>;
const drawer = ref<HtmlElement>();

watch(() => props.open, (open) => {
  if (open) void nextTick(() => drawer.value?.querySelector<HtmlElement>('button, [href], input, select')?.focus());
}, { immediate: true });
</script>

<template>
  <div
    v-if="open"
    class="drawer-backdrop"
    @click.self="emit('close')"
  >
    <aside
      ref="drawer"
      class="drawer"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
      @keydown.esc.prevent="emit('close')"
    >
      <header class="drawer__header">
        <h2>{{ title }}</h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="closeLabel"
          @click="emit('close')"
        >
          ×
        </button>
      </header>
      <div class="drawer__body">
        <slot />
      </div>
      <footer
        v-if="$slots.actions"
        class="drawer__actions"
      >
        <slot name="actions" />
      </footer>
    </aside>
  </div>
</template>
