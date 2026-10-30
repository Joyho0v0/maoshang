<script setup lang="ts">
import { formatQuantity, type DecimalString } from '../core/formatters';

interface Props {
  value: DecimalString;
  unit: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span class="quantity-text">{{ formatQuantity(props.value, props.unit) }}</span>
</template>
