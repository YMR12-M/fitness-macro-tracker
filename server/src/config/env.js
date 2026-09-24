// Validated configuration. The process refuses to boot on bad config rather
// than failing later at the first request that happens to need it.
import { z } from 'zod';

const bool = (fallback) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : v === 'true' || v === '1'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default('fittrack'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('fittrack'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_SSL: bool(false),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  COOKIE_SECURE: bool(false),
  COOKIE_DOMAIN: z.string().optional(),

  USDA_API_KEY: z.string().optional(),
  USDA_API_BASE: z.string().url().default('https://api.nal.usda.gov/fdc/v1')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`);
  process.exit(1);
}

/** Prefer DATABASE_URL when present; fall back to discrete DB_* values. */
function databaseConfig(env) {
  const base = {
    connectionLimit: env.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
    // DECIMAL columns arrive as strings by default; the API returns numbers.
    decimalNumbers: true,
    dateStrings: ['DATE'],
    enableKeepAlive: true
  };

  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    return {
      ...base,
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: env.DB_SSL || url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: true } : undefined
    };
  }

  return {
    ...base,
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined
  };
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const dbConfig = databaseConfig(env);
export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
