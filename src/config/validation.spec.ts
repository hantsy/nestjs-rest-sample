import { validationSchema } from './validation';

describe('validationSchema', () => {
  it('should be defined', () => {
    expect(validationSchema).toBeDefined();
  });

  it('should validate valid env vars', () => {
    const validEnv = {
      NODE_ENV: 'test',
      PORT: '3000',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET_KEY: 'test-secret-key-12345678',
      JWT_EXPIRES_IN: '3600s',
      JWT_REFRESH_SECRET_KEY: 'test-refresh-key-12345678',
      JWT_REFRESH_EXPIRES_IN: '7d',
      SENDGRID_API_KEY: 'SG.test-key',
    };

    const result = validationSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('should use default values', () => {
    const minimalEnv = {
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET_KEY: 'test-secret-key-12345678',
      JWT_REFRESH_SECRET_KEY: 'test-refresh-key-12345678',
      SENDGRID_API_KEY: 'SG.test-key',
    };

    const result = validationSchema.safeParse(minimalEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.JWT_EXPIRES_IN).toBe('3600s');
      expect(result.data.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    }
  });

  it('should fail if MONGODB_URI is missing', () => {
    const invalidEnv = {
      JWT_SECRET_KEY: 'test-secret-key-12345678',
      JWT_REFRESH_SECRET_KEY: 'test-refresh-key-12345678',
      SENDGRID_API_KEY: 'SG.test-key',
    };

    const result = validationSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it('should fail if JWT_SECRET_KEY is too short', () => {
    const invalidEnv = {
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET_KEY: 'short',
      JWT_REFRESH_SECRET_KEY: 'test-refresh-key-12345678',
      SENDGRID_API_KEY: 'SG.test-key',
    };

    const result = validationSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });

  it('should fail if NODE_ENV is invalid', () => {
    const invalidEnv = {
      NODE_ENV: 'invalid',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET_KEY: 'test-secret-key-12345678',
      JWT_REFRESH_SECRET_KEY: 'test-refresh-key-12345678',
      SENDGRID_API_KEY: 'SG.test-key',
    };

    const result = validationSchema.safeParse(invalidEnv);
    expect(result.success).toBe(false);
  });
});
