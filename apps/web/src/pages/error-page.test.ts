import { mount } from '@vue/test-utils';

import ErrorPage from './ErrorPage.vue';

describe('ErrorPage', () => {
  it('moves from an error state to an explicit retrying state', async () => {
    const wrapper = mount(ErrorPage);

    expect(wrapper.text()).toContain('同步暂时没有完成');
    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('正在重新加载状态');
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
