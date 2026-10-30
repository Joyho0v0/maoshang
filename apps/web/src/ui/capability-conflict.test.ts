import { h } from 'vue';
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

  it('supports server transition checks and an explicit disabled reason', () => {
    const wrapper = mount(CapabilityGate, {
      props: {
        capabilities: ['order.update'],
        capability: 'order.update',
        transition: 'CONFIRM',
        allowedTransitions: [],
        display: 'disable',
        reason: '当前订单不能确认',
      },
      slots: {
        default: ({ disabled, reasonId }: { disabled: boolean; reasonId: string }) => h(
          'button',
          { disabled, 'aria-describedby': reasonId },
          '确认订单',
        ),
      },
    });

    const action = wrapper.get('button');
    const reasonId = action.attributes('aria-describedby');
    expect((action.element as HTMLButtonElement).disabled).toBe(true);
    expect(reasonId).toBeTruthy();
    expect(wrapper.get(`#${reasonId}`).text()).toContain('当前订单不能确认');
    expect(wrapper.get('[aria-disabled="true"]').attributes('inert')).toBeUndefined();
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
