import { mount } from '@vue/test-utils';

import ProblemSummary from './ProblemSummary.vue';

describe('ProblemSummary', () => {
  it('shows safe guidance, violations, and request id without exposing detail', () => {
    const wrapper = mount(ProblemSummary, {
      props: {
        problem: {
          type: 'urn:autoflow:problem:validation-failed',
          title: '请求未通过校验',
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: 'internal stack and filesystem path must not be shown',
          requestId: 'request-123',
          violations: [{ field: 'name', code: 'REQUIRED', message: '请输入名称' }],
        },
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain('请求未通过校验');
    expect(wrapper.text()).toContain('请输入名称');
    expect(wrapper.text()).toContain('request-123');
    expect(wrapper.text()).not.toContain('internal stack');
    expect(wrapper.text()).not.toContain('filesystem path');
  });
});
