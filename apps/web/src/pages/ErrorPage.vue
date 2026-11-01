<script setup lang="ts">
import { ref } from 'vue';

import PageState from '../ui/PageState.vue';

const state = ref<'error' | 'loading'>('error');

function retry() {
  state.value = 'loading';
}
</script>

<template>
  <div class="page page--state">
    <PageState
      v-if="state === 'error'"
      state="error"
      heading="同步暂时没有完成"
      message="请求边界已安全收口。等正式契约接入后，这里会提供可重试的错误详情。"
      action-label="重新加载"
      :heading-level="1"
      @action="retry"
    />
    <PageState
      v-else
      state="loading"
      heading="正在重新加载状态"
      message="重试动作已开始；真实适配器接入后，这里会继续显示请求结果。"
      :heading-level="1"
    />
  </div>
</template>
