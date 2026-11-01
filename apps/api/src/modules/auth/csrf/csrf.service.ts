import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export interface CsrfTokenRecord {
  csrfToken: string;
  expiresAt: string;
}

interface StoredCsrfToken extends CsrfTokenRecord {
  lastAccessAt: number;
}

@Injectable()
export class CsrfService {
  private readonly tokens = new Map<string, StoredCsrfToken>();
  private readonly ttlMs = 10 * 60 * 1000;

  bootstrap(sessionKey: string): CsrfTokenRecord {
    this.prune();
    const existing = this.tokens.get(sessionKey);
    if (existing !== undefined && Date.parse(existing.expiresAt) > Date.now()) return { csrfToken: existing.csrfToken, expiresAt: existing.expiresAt };
    const record = { csrfToken: randomBytes(32).toString('base64url'), expiresAt: new Date(Date.now() + this.ttlMs).toISOString(), lastAccessAt: Date.now() };
    this.tokens.set(sessionKey, record);
    return { csrfToken: record.csrfToken, expiresAt: record.expiresAt };
  }

  rotate(sessionKey: string): CsrfTokenRecord {
    this.tokens.delete(sessionKey);
    return this.bootstrap(sessionKey);
  }

  validate(sessionKey: string, token: string | undefined): boolean {
    this.prune();
    const record = this.tokens.get(sessionKey);
    if (record === undefined || Date.parse(record.expiresAt) <= Date.now()) return false;
    record.lastAccessAt = Date.now();
    return token === record.csrfToken;
  }

  currentToken(sessionKey: string): string | undefined {
    this.prune();
    return this.tokens.get(sessionKey)?.csrfToken;
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, record] of this.tokens) {
      if (Date.parse(record.expiresAt) <= now) this.tokens.delete(key);
    }
    while (this.tokens.size > 10_000) {
      const oldest = [...this.tokens.entries()].sort((left, right) => left[1].lastAccessAt - right[1].lastAccessAt)[0];
      if (oldest === undefined) break;
      this.tokens.delete(oldest[0]);
    }
  }
}
