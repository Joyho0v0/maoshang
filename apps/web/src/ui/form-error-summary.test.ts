import { mount } from '@vue/test-utils';

import FormErrorSummary from './FormErrorSummary.vue';
import { formErrorId } from './form-error';

describe('FormErrorSummary', () => {
  it('focuses the summary when a submit changes errors from empty to non-empty', async () => {
    const wrapper = mount(FormErrorSummary, {
      props: { errors: [] },
      attachTo: document.body,
    });

    await wrapper.setProps({ errors: [{ field: 'customer-name', message: '请输入客户名称' }] });
    await wrapper.vm.$nextTick();

    const summary = wrapper.get('[role="alert"]');
    expect(document.activeElement).toBe(summary.element);
    expect(summary.get('a').attributes('href')).toBe('#customer-name');
    expect(summary.get(`#${formErrorId('customer-name')}`).text()).toContain('请输入客户名称');
    wrapper.unmount();
  });

  it('does not steal focus again while the same errors remain visible', async () => {
    const wrapper = mount(FormErrorSummary, {
      props: { errors: [{ field: 'name', message: '请输入名称' }] },
      attachTo: document.body,
    });
    const other = document.createElement('button');
    document.body.append(other);
    other.focus();

    await wrapper.setProps({ errors: [{ field: 'name', message: '请输入名称' }] });
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(other);
    wrapper.unmount();
  });
});
