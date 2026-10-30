<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

import {
  createUiId,
  focusFirst,
  restoreFocus,
  trapFocus,
} from './focus-management';

interface Props {
  open: boolean;
  title: string;
  closeLabel?: string;
  description?: string;
  busy?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeLabel: '关闭',
  description: '',
  busy: false,
});
const emit = defineEmits<{ close: [] }>();
type HtmlElement = InstanceType<typeof globalThis.HTMLElement>;
const dialog = ref<HtmlElement>();
let opener: HtmlElement | null = null;
const titleId = createUiId('dialog-title');
const descriptionId = createUiId('dialog-description');

watch(() => props.open, (open) => {
  if (open) {
    opener = globalThis.document.activeElement instanceof globalThis.HTMLElement
      ? globalThis.document.activeElement
      : null;
    void nextTick(() => {
      if (dialog.value) focusFirst(dialog.value);
    });
  } else {
    restoreFocus(opener);
    opener = null;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  if (props.open) restoreFocus(opener);
});

function requestClose(): void {
  if (!props.busy) emit('close');
}

function onKeydown(event: globalThis.KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    requestClose();
    return;
  }
  if (dialog.value) trapFocus(dialog.value, event);
}
</script>

<template>
  <div
    v-if="open"
    class="dialog-backdrop"
    @click.self="requestClose"
  >
    <section
      ref="dialog"
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descriptionId : undefined"
      :aria-busy="busy ? 'true' : undefined"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <header class="dialog__header">
        <h2 :id="titleId">
          {{ title }}
        </h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="closeLabel"
          :disabled="busy"
          @click="requestClose"
        >
          ×
        </button>
      </header>
      <p
        v-if="description"
        :id="descriptionId"
        class="dialog__description"
      >
        {{ description }}
      </p>
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
