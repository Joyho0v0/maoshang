import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export interface CsrfTokenRecord {
  csrfToken: string;
  expiresAt: string;
}

@Injectable()
export class CsrfService {
  private readonly tokens = new Map<string, CsrfTokenRecord>();
  private readonly ttlMs = 10 * 60 * 1000;

  bootstrap(sessionKey: string): CsrfTokenRecord {
    const existing = this.tokens.get(sessionKey);
    if (existing !== undefined && Date.parse(existing.expiresAt) > Date.now()) return existing;
    const record = { csrfToken: randomBytes(32).toString('base64url'), expiresAt: new Date(Date.now() + this.ttlMs).toISOString() };
    this.tokens.set(sessionKey, record);
    return record;
  }

  rotate(sessionKey: string): CsrfTokenRecord {
    this.tokens.delete(sessionKey);
    return this.bootstrap(sessionKey);
  }

  validate(sessionKey: string, token: string | undefined): boolean {
    const record = this.tokens.get(sessionKey);
    return record !== undefined && Date.parse(record.expiresAt) > Date.now() && token === record.csrfToken;
  }
}
