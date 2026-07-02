import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string().min(20, 'BOT_TOKEN is required'),
  WEBHOOK_URL: z.string().url().optional(),
  WEBHOOK_SECRET: z.string().min(8).default('change-this-secret'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be a 64 char hex string (32 bytes)'),
  ADMIN_IDS: z.string().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(30),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check your .env file against .env.example');
}

export const env = {
  ...parsed.data,
  adminIds: parsed.data.ADMIN_IDS.split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => BigInt(id)),
};
