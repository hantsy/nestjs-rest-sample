import { refreshTokenSchema } from './refresh-token.dto';

describe('refreshTokenSchema', () => {
  it('should parse a valid refresh token', () => {
    const data = { refresh_token: 'eyJhbGciOiJIUzI1NiIs' };
    expect(refreshTokenSchema.parse(data)).toEqual(data);
  });

  it('should reject an empty refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: '' });
    expect(result.success).toBe(false);
  });

  it('should reject a missing refresh token', () => {
    const result = refreshTokenSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject a non-string refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: 12345 });
    expect(result.success).toBe(false);
  });

  it('should accept a single character refresh token (min boundary)', () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: 'a' });
    expect(result.success).toBe(true);
  });

  it('should strip unknown keys', () => {
    const result = refreshTokenSchema.parse({
      refresh_token: 'token',
      extra: 'value',
    });
    expect(result).toEqual({ refresh_token: 'token' });
  });
});
