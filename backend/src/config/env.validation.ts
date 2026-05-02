import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().optional(),
  PORT: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_EMAIL: z.string().optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Environment validation failed: ${parsed.error.message}`);
  }

  const env = parsed.data;
  const dbUrl = new URL(env.DATABASE_URL);

  if (env.NODE_ENV === 'production') {
    const sslMode = dbUrl.searchParams.get('sslmode');
    const connectionLimit = dbUrl.searchParams.get('connection_limit');

    if (sslMode !== 'require') {
      throw new Error('DATABASE_URL must include sslmode=require in production');
    }
    if (connectionLimit !== '5') {
      throw new Error('DATABASE_URL must include connection_limit=5 in production');
    }
  }

  return env;
}
