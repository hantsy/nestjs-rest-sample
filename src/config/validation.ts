import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().uri(),
  JWT_SECRET_KEY: Joi.string().min(16),
  JWT_EXPIRES_IN: Joi.string().default('3600s'),
  JWT_REFRESH_SECRET_KEY: Joi.string().min(16),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  SENDGRID_API_KEY: Joi.string(),
});
