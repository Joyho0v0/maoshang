import { describe, expect, it } from 'vitest';
import {
  ControlledAuthenticationProvider,
  hashControlledPassword,
} from '../../apps/api/src/modules/identity/application/controlled-authentication.provider.js';

describe('controlled authentication provider', () => {
  const provider = new ControlledAuthenticationProvider([
    {
      username: 'Admin@Example.test',
      subject: 'local-admin-subject',
      passwordHash: hashControlledPassword('correct horse battery staple'),
    },
  ]);

  it('authenticates an explicitly configured local credential', async () => {
    await expect(provider.authenticate({
      provider: 'LOCAL_PASSWORD',
      username: 'admin@example.test',
      password: 'correct horse battery staple',
    })).resolves.toEqual({ subject: 'local-admin-subject', username: 'admin@example.test' });
  });

  it('fails closed for wrong credentials and unsupported providers', async () => {
    await expect(provider.authenticate({
      provider: 'LOCAL_PASSWORD',
      username: 'admin@example.test',
      password: 'wrong',
    })).resolves.toBeUndefined();
    await expect(provider.authenticate({
      provider: 'OIDC_SSO',
      authorizationCode: 'code',
    })).resolves.toBeUndefined();
  });
});
