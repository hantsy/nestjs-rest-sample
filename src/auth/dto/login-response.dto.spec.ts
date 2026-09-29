import { loginResponseSchema } from './login-response.dto';

describe('loginResponseSchema', () => {
  it('should parse a valid token pair', () => {
    const data = { access_token: 'access', refresh_token: 'refresh' };
    expect(loginResponseSchema.parse(data)).toEqual(data);
  });

  it('should reject when access_token is missing', () => {
    const result = loginResponseSchema.safeParse({ refresh_token: 'refresh' });
    expect(result.success).toBe(false);
  });

  it('should reject when refresh_token is missing', () => {
    const result = loginResponseSchema.safeParse({ access_token: 'access' });
    expect(result.success).toBe(false);
  });

  it('should reject non-string tokens', () => {
    const result = loginResponseSchema.safeParse({
      access_token: 1,
      refresh_token: null,
    });
    expect(result.success).toBe(false);
  });
});
