<script setup lang="ts">
import AppStateView from '../ui/AppStateView.vue';
</script>

<template>
  <div class="page page--state">
    <AppStateView
      state="loading"
      heading="正在准备同步"
      message="正在等待后续契约适配器接管请求。"
      :heading-level="1"
    />
  </div>
</template>
