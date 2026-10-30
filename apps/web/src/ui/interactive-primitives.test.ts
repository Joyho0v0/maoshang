import { mount } from '@vue/test-utils';

import Dialog from './Dialog.vue';
import Drawer from './Drawer.vue';
import ToastRegion from './ToastRegion.vue';

describe('interactive primitives', () => {
  it('returns focus to the opener and closes a dialog with Escape', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const wrapper = mount(Dialog, {
      props: { open: true, title: '编辑客户' },
      slots: { default: '<button data-testid="inside">保存</button>' },
      attachTo: document.body,
    });

    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(wrapper.get('button[aria-label="关闭"]').element);
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toHaveLength(1);
    await wrapper.setProps({ open: false });
    expect(document.activeElement).toBe(opener);
    wrapper.unmount();
  });

  it('provides dialog semantics and Escape handling for a drawer', async () => {
    const wrapper = mount(Drawer, {
      props: { open: true, title: '筛选' },
      slots: { default: '<button>应用筛选</button>' },
    });

    expect(wrapper.get('[role="dialog"]').attributes('aria-modal')).toBe('true');
    await wrapper.get('[role="dialog"]').trigger('keydown.esc');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('announces toast messages without storing them', () => {
    const wrapper = mount(ToastRegion, {
      props: { toasts: [{ id: 'toast-1', message: '已保存', tone: 'success' }] },
    });

    expect(wrapper.get('[role="status"]').text()).toContain('已保存');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
