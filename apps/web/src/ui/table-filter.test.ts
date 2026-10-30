import { mount } from '@vue/test-utils';

import CursorPager from './CursorPager.vue';
import DataTable from './DataTable.vue';
import FilterBar from './FilterBar.vue';

describe('table and filter primitives', () => {
  it('renders a semantic table and cursor pagination without offset controls', () => {
    const wrapper = mount(DataTable, {
      props: {
        rows: [{ id: '1', name: 'Acme', status: 'OPEN' }],
        columns: [
          { key: 'name', label: '名称' },
          { key: 'status', label: '状态' },
        ],
        rowKey: 'id',
      },
      global: { components: { CursorPager } },
    });

    expect(wrapper.get('table').attributes('aria-label')).toBe('数据表格');
    expect(wrapper.get('th').text()).toBe('名称');
    expect(wrapper.text()).toContain('Acme');
    expect(wrapper.findAll('input[type="number"]')).toHaveLength(0);
  });

  it('exposes loading and error states plus controlled cell/action slots', () => {
    const wrapper = mount(DataTable, {
      props: {
        rows: [{ id: '1', name: 'Acme' }],
        columns: [{ key: 'name', label: '名称' }],
        rowKey: 'id',
        state: 'ready',
      },
      slots: {
        'cell-name': '<strong data-testid="custom-cell">{{ value }}</strong>',
        actions: '<button data-testid="row-action">打开</button>',
      },
    });

    expect(wrapper.get('[data-testid="custom-cell"]').text()).toBe('Acme');
    expect(wrapper.get('[data-testid="row-action"]')).toBeTruthy();
  });

  it('renders a retryable error state without pretending rows are available', async () => {
    const wrapper = mount(DataTable, {
      props: {
        rows: [],
        columns: [{ key: 'name', label: '名称' }],
        rowKey: 'id',
        state: 'error',
        errorMessage: '列表暂时不可用',
        retryLabel: '重新加载',
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain('列表暂时不可用');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('emits cursor navigation and keeps filter input out of URL semantics', async () => {
    const pager = mount(CursorPager, {
      props: { nextCursor: 'next-2' },
    });
    await pager.get('button[aria-label="下一页"]').trigger('click');
    expect(pager.emitted('next')).toHaveLength(1);

    const filter = mount(FilterBar, {
      props: { modelValue: { status: 'OPEN' } },
    });
    expect(filter.findAll('input[name="filter[q]"]')).toHaveLength(0);
    expect(filter.findAll('select[name="filter[status]"]')).toHaveLength(1);
  });

  it('accepts endpoint-provided public filter options instead of hardcoded values', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        modelValue: { type: 'export' },
        options: [
          { key: 'type', label: '类型', values: [{ value: 'export', label: '出口' }] },
          { key: 'state', label: '流程', values: [{ value: 'OPEN', label: '开放' }] },
          { key: 'ownerId', label: '负责人', values: [{ value: 'u-1', label: '李明' }] },
        ],
      },
    });

    expect(wrapper.findAll('select[name="filter[type]"]')).toHaveLength(1);
    expect(wrapper.findAll('select[name="filter[state]"]')).toHaveLength(1);
    expect(wrapper.findAll('select[name="filter[ownerId]"]')).toHaveLength(1);
    await wrapper.get('select[name="filter[state]"]').setValue('OPEN');
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toMatchObject({ type: 'export', state: 'OPEN' });
  });
});
