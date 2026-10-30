import { createHash, timingSafeEqual } from 'node:crypto';
import type { AuthenticationProvider } from './session.service.js';
import type { ProviderIdentity, SessionCredentials } from './types.js';

export interface ControlledCredential {
  username: string;
  subject: string;
  passwordHash: string;
}

/**
 * A deliberately explicit local adapter for isolated development and tests.
 * It is not registered by the application default, so production cannot
 * accidentally fall back to a local password store.
 */
export class ControlledAuthenticationProvider implements AuthenticationProvider {
  private readonly credentials: readonly ControlledCredential[];

  constructor(credentials: readonly ControlledCredential[]) {
    this.credentials = credentials.map((credential) => ({
      ...credential,
      username: normalizeUsername(credential.username),
    }));
  }

  async authenticate(credentials: SessionCredentials): Promise<ProviderIdentity | undefined> {
    if (credentials.provider !== 'LOCAL_PASSWORD' || typeof credentials.username !== 'string' || typeof credentials.password !== 'string') {
      return undefined;
    }
    const username = normalizeUsername(credentials.username);
    const passwordHash = hashControlledPassword(credentials.password);
    const configured = this.credentials.find((credential) => credential.username === username);
    if (configured === undefined || !safeHashEqual(configured.passwordHash, passwordHash)) return undefined;
    return { subject: configured.subject, username };
  }
}

export function hashControlledPassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function safeHashEqual(left: string, right: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}
