<script setup lang="ts">
interface FilterState {
  readonly status?: string;
}

interface Props {
  modelValue: FilterState;
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [value: FilterState] }>();

function updateStatus(event: globalThis.Event): void {
  const target = event.target as globalThis.HTMLSelectElement;
  const next: { status?: string } = { ...props.modelValue };
  if (target.value.length > 0) next.status = target.value;
  else delete next.status;
  emit('update:modelValue', next);
}
</script>

<template>
  <form
    class="filter-bar"
    role="search"
    @submit.prevent
  >
    <label for="filter-status">状态</label>
    <select
      id="filter-status"
      name="filter[status]"
      :value="modelValue.status ?? ''"
      @change="updateStatus"
    >
      <option value="">
        全部
      </option>
      <option value="OPEN">
        开放
      </option>
      <option value="CLOSED">
        已关闭
      </option>
    </select>
  </form>
</template>
