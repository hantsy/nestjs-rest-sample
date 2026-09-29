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

  describe('additional cases', () => {
    const baseEnv = {
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET_KEY: 'test-secret-key-12345678',
      JWT_REFRESH_SECRET_KEY: 'test-refresh-key-12345678',
      SENDGRID_API_KEY: 'SG.test-key',
    };

    it('should coerce PORT from string to number', () => {
      const result = validationSchema.safeParse({ ...baseEnv, PORT: '8080' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
      }
    });

    it('should fail if PORT is not numeric', () => {
      const result = validationSchema.safeParse({ ...baseEnv, PORT: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should fail if MONGODB_URI is not a valid url', () => {
      const result = validationSchema.safeParse({
        ...baseEnv,
        MONGODB_URI: 'not a url',
      });
      expect(result.success).toBe(false);
    });

    it('should fail if JWT_REFRESH_SECRET_KEY is too short', () => {
      const result = validationSchema.safeParse({
        ...baseEnv,
        JWT_REFRESH_SECRET_KEY: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should accept secrets of exactly 16 characters', () => {
      const result = validationSchema.safeParse({
        ...baseEnv,
        JWT_SECRET_KEY: 'a'.repeat(16),
        JWT_REFRESH_SECRET_KEY: 'b'.repeat(16),
      });
      expect(result.success).toBe(true);
    });

    it('should reject secrets of 15 characters', () => {
      const result = validationSchema.safeParse({
        ...baseEnv,
        JWT_SECRET_KEY: 'a'.repeat(15),
      });
      expect(result.success).toBe(false);
    });

    it('should fail if SENDGRID_API_KEY is missing', () => {
      const { SENDGRID_API_KEY, ...env } = baseEnv;
      const result = validationSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it.each(['development', 'production', 'test'])(
      'should accept NODE_ENV=%s',
      (nodeEnv) => {
        const result = validationSchema.safeParse({
          ...baseEnv,
          NODE_ENV: nodeEnv,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.NODE_ENV).toBe(nodeEnv);
        }
      },
    );

    it('should keep provided JWT expiration values over defaults', () => {
      const result = validationSchema.safeParse({
        ...baseEnv,
        JWT_EXPIRES_IN: '60s',
        JWT_REFRESH_EXPIRES_IN: '30d',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.JWT_EXPIRES_IN).toBe('60s');
        expect(result.data.JWT_REFRESH_EXPIRES_IN).toBe('30d');
      }
    });

    it('should report all issues at once for multiple invalid fields', () => {
      const result = validationSchema.safeParse({
        NODE_ENV: 'invalid',
        JWT_SECRET_KEY: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toEqual(
          expect.arrayContaining([
            'NODE_ENV',
            'MONGODB_URI',
            'JWT_SECRET_KEY',
            'JWT_REFRESH_SECRET_KEY',
            'SENDGRID_API_KEY',
          ]),
        );
      }
    });
  });
});
