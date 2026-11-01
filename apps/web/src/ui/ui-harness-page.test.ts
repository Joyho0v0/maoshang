import { mount } from '@vue/test-utils';

import UiHarnessPage from '../pages/UiHarnessPage.vue';

describe('UiHarnessPage', () => {
  it('exercises the shared dialog, drawer and form error focus contracts', async () => {
    const wrapper = mount(UiHarnessPage, { attachTo: document.body });

    await wrapper.get('[data-testid="open-dialog"]').trigger('click');
    expect(wrapper.get('[role="dialog"]').text()).toContain('可访问对话框');
    await wrapper.get('button[aria-label="关闭"]').trigger('click');

    await wrapper.get('[data-testid="open-drawer"]').trigger('click');
    expect(wrapper.get('[role="dialog"]').text()).toContain('可访问抽屉');
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' });

    await wrapper.get('[data-testid="submit-form"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(wrapper.get('[role="alert"]').element);
    expect(wrapper.get('#customer-name').attributes('aria-describedby')).toBe('customer-name-error');
    wrapper.unmount();
  });
});
