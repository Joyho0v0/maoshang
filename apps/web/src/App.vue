<script setup lang="ts">
import AppShell from './ui/AppShell.vue';
import GlobalErrorBoundary from './ui/GlobalErrorBoundary.vue';
</script>

<template>
  <GlobalErrorBoundary>
    <AppShell />
  </GlobalErrorBoundary>
</template>
