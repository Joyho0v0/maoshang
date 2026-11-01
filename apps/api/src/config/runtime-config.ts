export type RuntimeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface RuntimeConfig {
  nodeEnv: RuntimeEnvironment;
  databaseUrl: string;
  sessionSecret: string;
}

export function loadRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
  const nodeEnv = env.NODE_ENV;
  if (!isRuntimeEnvironment(nodeEnv)) throw new Error('NODE_ENV must be one of development, test, staging, production.');
  const databaseUrl = env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.length === 0) throw new Error('DATABASE_URL is required.');
  const sessionSecret = env.SESSION_SECRET;
  if (sessionSecret === undefined || sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
  return { nodeEnv, databaseUrl, sessionSecret };
}

function isRuntimeEnvironment(value: string | undefined): value is RuntimeEnvironment {
  return value === 'development' || value === 'test' || value === 'staging' || value === 'production';
}
