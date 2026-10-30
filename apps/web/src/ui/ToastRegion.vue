<script setup lang="ts">
export interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly tone?: 'success' | 'info' | 'warning' | 'error';
}

interface Props {
  toasts: readonly ToastItem[];
}

defineProps<Props>();
const emit = defineEmits<{ dismiss: [id: string] }>();
</script>

<template>
  <div
    class="toast-region"
    aria-label="通知"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.tone ?? 'info'}`"
      role="status"
      aria-live="polite"
    >
      <span>{{ toast.message }}</span>
      <button
        class="icon-button"
        type="button"
        aria-label="关闭通知"
        @click="emit('dismiss', toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
