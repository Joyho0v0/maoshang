<script setup lang="ts">
export interface TableColumn {
  readonly key: string;
  readonly label: string;
}

interface Props {
  rows: readonly Record<string, unknown>[];
  columns: readonly TableColumn[];
  rowKey: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), { ariaLabel: '数据表格' });

function value(row: Record<string, unknown>, key: string): string {
  const item = row[key];
  return item === null || item === undefined ? '—' : String(item);
}

function keyFor(row: Record<string, unknown>, index: number): string {
  return `${String(row[props.rowKey] ?? index)}`;
}
</script>

<template>
  <div class="table-scroll">
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
            {{ value(row, column.key) }}
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length">
            暂无数据
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
