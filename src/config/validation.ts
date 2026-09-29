import { z } from 'zod';

export const validationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.url(),
  JWT_SECRET_KEY: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('3600s'),
  JWT_REFRESH_SECRET_KEY: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SENDGRID_API_KEY: z.string(),
});
