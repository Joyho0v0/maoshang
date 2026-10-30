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
});
