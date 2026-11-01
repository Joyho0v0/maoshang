export class DomainProblemError extends Error {
  constructor(readonly code: string, readonly status = 409, readonly meta?: Record<string, unknown>, message = code) {
    super(message);
    this.name = 'DomainProblemError';
  }
}
