import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      SEED_DATABASE: 'true',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET_KEY: 'test-jwt-secret-key-for-e2e-tests',
      JWT_REFRESH_SECRET_KEY: 'test-jwt-refresh-secret-key-for-e2e',
    },
  },
});
