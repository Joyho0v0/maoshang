export type UserRole = 'super-admin' | 'team-admin' | 'sales' | 'customer';

export interface SessionUser {
  id: string;
  displayName: string;
  role: UserRole;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  requestId?: string;
  retryable?: boolean;
  meta?: Record<string, unknown> | null;
  violations?: Array<{ field: string; code: string; message: string }>;
  headers?: Record<string, string>;
}

export interface SessionBootstrapResponse {
  authenticated: boolean;
  user?: SessionUser;
  csrfToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionCredentials {
  user: SessionUser;
  csrfToken: string;
}

export interface CsrfRotationResponse {
  csrfToken: string;
}

export type SessionStatus =
  | 'anonymous'
  | 'bootstrapping'
  | 'authenticated'
  | 'logging-out'
  | 'error';

export interface SessionSnapshot {
  status: SessionStatus;
  epoch: number;
  user?: SessionUser;
  csrfToken?: string;
  problem?: ProblemDetails;
}

export interface ApiRequest {
  method: string;
  href: string;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  etag?: string;
  requiresCsrf?: boolean;
  operationId?: string;
}

export interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export type PendingCommandState =
  | 'submitting'
  | 'querying-status'
  | 'in-progress'
  | 'recovery-required'
  | 'replaying-same-command'
  | 'result-unknown'
  | 'succeeded'
  | 'failed-stable'
  | 'command-not-found';

export interface PendingCommand {
  id: string;
  idempotencyKey: string;
  sessionEpoch: number;
  status: 'queued' | 'in-flight' | 'succeeded' | 'failed' | 'cancelled';
  state?: PendingCommandState;
  operationId?: string;
  method?: string;
  href?: string;
  canonicalBody?: string;
  etag?: string;
  createdAt: number;
  recoveryDeadline?: number;
  recoveryAttempts?: number;
  requestId?: string;
  problem?: ProblemDetails;
}

export interface ContractAdapter {
  bootstrap(signal?: AbortSignal): Promise<SessionBootstrapResponse>;
  login(input: LoginInput, signal?: AbortSignal): Promise<SessionCredentials>;
  logout(signal?: AbortSignal, csrfToken?: string): Promise<void>;
  rotateCsrf(signal?: AbortSignal): Promise<CsrfRotationResponse>;
  request(request: ApiRequest, signal: AbortSignal): Promise<HttpResponse<unknown>>;
}
