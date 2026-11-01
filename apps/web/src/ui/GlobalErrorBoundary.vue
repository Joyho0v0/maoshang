<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const hasError = ref(false);
const renderKey = ref(0);

onErrorCaptured(() => {
  hasError.value = true;
  return false;
});

function reset() {
  hasError.value = false;
  renderKey.value += 1;
}
</script>

<template>
  <section
    v-if="hasError"
    class="global-error"
    role="alert"
    aria-live="assertive"
  >
    <p class="eyebrow">
      页面状态
    </p>
    <h1>页面遇到一点问题</h1>
    <p>当前内容没有安全地完成渲染。重新渲染后仍失败时，请联系管理员。</p>
    <button
      class="button"
      type="button"
      @click="reset"
    >
      重新渲染
    </button>
  </section>
  <div
    v-else
    :key="renderKey"
  >
    <slot />
  </div>
</template>
