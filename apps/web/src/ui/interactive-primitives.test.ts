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

  it('traps drawer focus, restores the opener, and handles Escape', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const wrapper = mount(Drawer, {
      props: { open: true, title: '筛选' },
      slots: {
        default: '<button data-testid="first">第一项</button><button data-testid="last">最后一项</button>',
      },
      attachTo: document.body,
    });

    await wrapper.vm.$nextTick();
    const drawer = wrapper.get('[role="dialog"]');
    expect(drawer.attributes('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(wrapper.get('button[aria-label="关闭"]').element);

    await drawer.trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(wrapper.get('[data-testid="first"]').element);
    await drawer.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(wrapper.get('button[aria-label="关闭"]').element);

    await drawer.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toHaveLength(1);
    await wrapper.setProps({ open: false });
    expect(document.activeElement).toBe(opener);
    wrapper.unmount();
  });

  it('associates unique title and description ids and blocks close while busy', async () => {
    const wrapper = mount(Dialog, {
      props: { open: true, title: '同步', description: '请等待当前请求完成。', busy: true },
    });

    const dialog = wrapper.get('[role="dialog"]');
    const titleId = dialog.attributes('aria-labelledby');
    const descriptionId = dialog.attributes('aria-describedby');
    expect(titleId).toBeTruthy();
    expect(descriptionId).toBeTruthy();
    expect(wrapper.get(`#${titleId}`).text()).toBe('同步');
    expect(wrapper.get(`#${descriptionId}`).text()).toContain('请等待');
    expect(dialog.attributes('aria-busy')).toBe('true');
    await dialog.trigger('keydown', { key: 'Escape' });
    await wrapper.get('button[aria-label="关闭"]').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  });

  it('restores drawer focus on unmount and blocks busy close paths', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const wrapper = mount(Drawer, {
      props: { open: true, title: '提交中', description: '请等待。', busy: true },
      slots: { default: '<button>完成</button>' },
      attachTo: document.body,
    });

    await wrapper.vm.$nextTick();
    const drawer = wrapper.get('[role="dialog"]');
    expect(drawer.attributes('aria-describedby')).toBeTruthy();
    expect(drawer.attributes('aria-busy')).toBe('true');
    await drawer.trigger('keydown', { key: 'Escape' });
    await wrapper.get('button[aria-label="关闭"]').trigger('click');
    await drawer.trigger('click', { self: true });
    expect(wrapper.emitted('close')).toBeUndefined();

    wrapper.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('gives separate instances unique accessible ids', () => {
    const first = mount(Dialog, { props: { open: true, title: '相同标题' }, attachTo: document.body });
    const second = mount(Dialog, { props: { open: true, title: '相同标题' }, attachTo: document.body });

    expect(first.get('[role="dialog"]').attributes('aria-labelledby')).not.toBe(
      second.get('[role="dialog"]').attributes('aria-labelledby'),
    );
    first.unmount();
    second.unmount();
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
