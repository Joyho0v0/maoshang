<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

interface Props {
  open: boolean;
  title: string;
  closeLabel?: string;
}

const props = withDefaults(defineProps<Props>(), { closeLabel: '关闭' });
const emit = defineEmits<{ close: [] }>();
type HtmlElement = InstanceType<typeof globalThis.HTMLElement>;
const dialog = ref<HtmlElement>();
let opener: HtmlElement | null = null;

watch(() => props.open, (open) => {
  if (open) {
    opener = globalThis.document.activeElement instanceof globalThis.HTMLElement
      ? globalThis.document.activeElement
      : null;
    void nextTick(() => focusFirst());
  } else {
    opener?.focus();
    opener = null;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  if (props.open) opener?.focus();
});

function focusFirst(): void {
  const first = dialog.value?.querySelector<HtmlElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  (first ?? dialog.value)?.focus();
}

function onKeydown(event: globalThis.KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...(dialog.value?.querySelectorAll<HtmlElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) ?? [])];
  if (focusable.length === 0) return;
  const current = globalThis.document.activeElement;
  const index = focusable.indexOf(current as HtmlElement);
  const next = event.shiftKey
    ? focusable[index <= 0 ? focusable.length - 1 : index - 1]
    : focusable[index === focusable.length - 1 ? 0 : index + 1];
  event.preventDefault();
  next?.focus();
}
</script>

<template>
  <div
    v-if="open"
    class="dialog-backdrop"
    @click.self="emit('close')"
  >
    <section
      ref="dialog"
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`dialog-title-${title.replace(/[^a-z0-9]+/gi, '-')}`"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <header class="dialog__header">
        <h2 :id="`dialog-title-${title.replace(/[^a-z0-9]+/gi, '-')}`">
          {{ title }}
        </h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="closeLabel"
          @click="emit('close')"
        >
          ×
        </button>
      </header>
      <div class="dialog__body">
        <slot />
      </div>
      <footer
        v-if="$slots.actions"
        class="dialog__actions"
      >
        <slot name="actions" />
      </footer>
    </section>
  </div>
</template>
