<script setup lang="ts">
export interface TableColumn {
  readonly key: string;
  readonly label: string;
}

export type TableState = 'ready' | 'loading' | 'error' | 'empty';

interface Props {
  rows: readonly Record<string, unknown>[];
  columns: readonly TableColumn[];
  rowKey: string;
  ariaLabel?: string;
  state?: TableState;
  errorMessage?: string;
  retryLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: '数据表格',
  state: 'ready',
  errorMessage: '列表暂时不可用。',
  retryLabel: '重新加载',
});
const emit = defineEmits<{ retry: [] }>();

function value(row: Record<string, unknown>, key: string): string {
  const item = row[key];
  return item === null || item === undefined ? '—' : String(item);
}

function keyFor(row: Record<string, unknown>, index: number): string {
  return `${String(row[props.rowKey] ?? index)}`;
}
</script>

<template>
  <div
    v-if="state === 'loading'"
    class="table-state"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    正在加载数据
  </div>
  <div
    v-else-if="state === 'error'"
    class="table-state table-state--error"
    role="alert"
    aria-live="assertive"
  >
    <p>{{ errorMessage }}</p>
    <button
      class="button button--quiet"
      type="button"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
  <div
    v-else-if="state === 'empty' || rows.length === 0"
    class="table-state"
    role="status"
    aria-live="polite"
  >
    暂无数据
  </div>
  <div
    v-else
    class="table-scroll"
  >
    <table :aria-label="ariaLabel">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
          >
            {{ column.label }}
          </th>
          <th
            v-if="$slots.actions"
            scope="col"
          >
            操作
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="keyFor(row, index)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="value(row, column.key)"
            >
              {{ value(row, column.key) }}
            </slot>
          </td>
          <td v-if="$slots.actions">
            <slot
              name="actions"
              :row="row"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
