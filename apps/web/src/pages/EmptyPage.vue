<script setup lang="ts">
import PageState from '../ui/PageState.vue';
</script>

<template>
  <div class="page page--state">
    <PageState
      state="empty"
      heading="待办列表是空的"
      message="新的审核或跟进事项出现后，会按客户当地时间显示在这里。"
      :heading-level="1"
    />
  </div>
</template>
