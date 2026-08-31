import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  // Optional: leave unset locally to store uploads on local disk instead
  // (see UploadsService) rather than needing a real Cloudinary account.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  QR_SIGNING_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().url().default('http://localhost:3001'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Infinito 2K26 <no-reply@infinito2k26.dev>'),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
