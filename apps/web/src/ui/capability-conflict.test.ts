import { mount } from '@vue/test-utils';

import CapabilityGate from './CapabilityGate.vue';
import ConflictDialog from './ConflictDialog.vue';

describe('capability and conflict primitives', () => {
  it('uses capability data rather than role text to decide visibility', () => {
    const wrapper = mount(CapabilityGate, {
      props: {
        capabilities: ['order.read'],
        capability: 'order.update',
      },
      slots: {
        default: '<button>编辑</button>',
        forbidden: '<p>没有执行权限</p>',
      },
    });

    expect(wrapper.text()).toContain('没有执行权限');
    expect(wrapper.text()).not.toContain('编辑');
  });

  it('allows a server transition and never offers last-write-wins override', async () => {
    const wrapper = mount(ConflictDialog, {
      props: {
        open: true,
        title: '内容已更新',
        currentVersion: 4,
        currentEtag: '"v4"',
      },
    });

    expect(wrapper.get('[role="dialog"]').text()).toContain('请刷新后重做');
    expect(wrapper.text()).not.toContain('覆盖');
    expect(wrapper.text()).not.toContain('自动合并');
    await wrapper.get('button[aria-label="刷新后重做"]').trigger('click');
    expect(wrapper.emitted('refresh')).toHaveLength(1);
  });
});
