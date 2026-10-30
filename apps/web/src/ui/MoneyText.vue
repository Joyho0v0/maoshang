<script setup lang="ts">
import { formatMoney, type DecimalString } from '../core/formatters';

interface Props {
  value: DecimalString;
  currency: string;
}

const props = defineProps<Props>();
</script>

<template>
  <span class="money-text">{{ formatMoney(props.value, props.currency) }}</span>
</template>
