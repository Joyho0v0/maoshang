import { CsrfService } from '../../apps/api/src/modules/auth/csrf/csrf.service.js';

describe('session-bound CSRF epochs', () => {
  it('shares a token only within one session and invalidates it on rotation', () => {
    const service = new CsrfService();
    const first = service.bootstrap('session:a');
    expect(service.bootstrap('session:a')).toEqual(first);
    expect(service.bootstrap('session:b').csrfToken).not.toBe(first.csrfToken);
    expect(service.validate('session:a', first.csrfToken)).toBe(true);
    const rotated = service.rotate('session:a');
    expect(rotated.csrfToken).not.toBe(first.csrfToken);
    expect(service.validate('session:a', first.csrfToken)).toBe(false);
    expect(service.validate('session:a', rotated.csrfToken)).toBe(true);
  });
});
