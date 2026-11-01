<script setup lang="ts">
import AppStateView from '../ui/AppStateView.vue';
</script>

<template>
  <div class="page page--state">
    <AppStateView
      state="empty"
      heading="待办列表是空的"
      message="新的审核或跟进事项出现后，会按客户当地时间显示在这里。"
      :heading-level="1"
    />
  </div>
</template>
