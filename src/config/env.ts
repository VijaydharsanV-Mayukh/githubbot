import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().default(''),
  DISCORD_CLIENT_ID: z.string().default(''),
  DISCORD_PUBLIC_KEY: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().default(''),
  DATABASE_URL: z.string().default('file:./dev.db'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('⚠️ Environment warning:', result.error.format());
  }
  return result.data || {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
    DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET || '',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    PORT: 3000,
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  };
};

export const env = parseEnv();
