import { mount } from '@vue/test-utils';

import PageState from './PageState.vue';

describe('PageState', () => {
  it.each([
    ['loading', '正在准备数据', 'status'],
    ['empty', '还没有数据', 'status'],
    ['error', '数据加载失败', 'alert'],
    ['forbidden', '没有访问权限', 'alert'],
    ['offline', '网络连接中断', 'alert'],
  ] as const)('renders the %s state as an accessible live region', (state, heading, role) => {
    const wrapper = mount(PageState, {
      props: { state, heading, message: '给出下一步的说明。' },
    });

    expect(wrapper.get(`[role="${role}"]`).text()).toContain(heading);
    expect(wrapper.get(`[role="${role}"]`).attributes('aria-live')).toBe(
      role === 'alert' ? 'assertive' : 'polite',
    );
  });

  it('exposes an action as a keyboard reachable button', async () => {
    const wrapper = mount(PageState, {
      props: {
        state: 'offline',
        heading: '网络连接中断',
        message: '检查连接后重试。',
        actionLabel: '重新连接',
      },
    });

    await wrapper.get('button').trigger('keydown.enter');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });
});
