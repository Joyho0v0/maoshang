<script setup lang="ts">
interface Props {
  nextCursor?: string;
  previousCursor?: string;
}

withDefaults(defineProps<Props>(), { nextCursor: '', previousCursor: '' });
const emit = defineEmits<{ next: []; previous: [] }>();
</script>

<template>
  <nav
    class="cursor-pager"
    aria-label="数据分页"
  >
    <button
      class="button button--quiet"
      type="button"
      aria-label="上一页"
      :disabled="!previousCursor"
      @click="emit('previous')"
    >
      上一页
    </button>
    <button
      class="button button--quiet"
      type="button"
      aria-label="下一页"
      :disabled="!nextCursor"
      @click="emit('next')"
    >
      下一页
    </button>
  </nav>
</template>
