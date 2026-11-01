import { mount } from '@vue/test-utils';

import AppStateView from './AppStateView.vue';

describe('AppStateView', () => {
  it.each([
    ['loading', '正在准备工作台'],
    ['error', '工作台暂时不可用'],
    ['empty', '还没有待办事项'],
  ] as const)('renders the %s state with useful guidance', (state, heading) => {
    const wrapper = mount(AppStateView, {
      props: {
        state,
        heading,
        message: '这里会显示下一步可以做什么。',
      },
    });

    expect(wrapper.get('[role="status"], [role="alert"]').text()).toContain(heading);
    expect(wrapper.text()).toContain('这里会显示下一步可以做什么。');
  });

  it('uses a page-level heading and alert semantics when configured for an error route', () => {
    const wrapper = mount(AppStateView, {
      props: {
        state: 'error',
        heading: '错误页标题',
        message: '错误页说明。',
        headingLevel: 1,
      },
    });

    expect(wrapper.get('h1').text()).toBe('错误页标题');
    expect(wrapper.get('[role="alert"]').attributes('aria-live')).toBe('assertive');
  });

  it('emits an action only when the action is offered', async () => {
    const wrapper = mount(AppStateView, {
      props: {
        state: 'error',
        heading: '工作台暂时不可用',
        message: '请重新加载。',
        actionLabel: '重新加载',
      },
    });

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });
});
