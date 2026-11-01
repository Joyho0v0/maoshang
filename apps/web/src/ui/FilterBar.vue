<script setup lang="ts">
export type PublicFilterKey = 'status' | 'type' | 'state' | 'ownerId';

export interface FilterOption {
  readonly key: PublicFilterKey;
  readonly label: string;
  readonly values: readonly { value: string; label: string }[];
}

interface Props {
  modelValue: Readonly<Record<string, string>>;
  options?: readonly FilterOption[];
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [{
    key: 'status',
    label: '状态',
    values: [
      { value: 'OPEN', label: '开放' },
      { value: 'CLOSED', label: '已关闭' },
    ],
  }],
});
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, string>] }>();

function updateFilter(key: PublicFilterKey, event: globalThis.Event): void {
  const target = event.target as globalThis.HTMLSelectElement;
  const next: Record<string, string> = { ...props.modelValue };
  if (target.value.length > 0) next[key] = target.value;
  else delete next[key];
  emit('update:modelValue', next);
}
</script>

<template>
  <form
    class="filter-bar"
    role="search"
    @submit.prevent
  >
    <div
      v-for="option in options"
      :key="option.key"
      class="filter-bar__field"
    >
      <label :for="`filter-${option.key}`">{{ option.label }}</label>
      <select
        :id="`filter-${option.key}`"
        :name="`filter[${option.key}]`"
        :value="modelValue[option.key] ?? ''"
        @change="updateFilter(option.key, $event)"
      >
        <option value="">
          全部
        </option>
        <option
          v-for="value in option.values"
          :key="value.value"
          :value="value.value"
        >
          {{ value.label }}
        </option>
      </select>
    </div>
  </form>
</template>
