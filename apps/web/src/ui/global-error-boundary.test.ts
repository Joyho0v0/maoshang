import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

import GlobalErrorBoundary from './GlobalErrorBoundary.vue';

describe('GlobalErrorBoundary', () => {
  it('turns an unexpected child error into a recoverable error state', async () => {
    const ThrowingChild = defineComponent({
      setup() {
        throw new Error('broken');
      },
      render: () => h('button', '触发错误'),
    });
    const wrapper = mount(GlobalErrorBoundary, {
      slots: {
        default: () => h(ThrowingChild),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.get('[role="alert"]').text()).toContain('页面遇到一点问题');
    expect(wrapper.get('button').text()).toContain('重新渲染');
  });
});
