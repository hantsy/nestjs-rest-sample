import { registerSchema } from './register.dto';

describe('registerSchema', () => {
  it('should be defined', () => {
    expect(registerSchema).toBeDefined();
  });

  it('should parse valid data', () => {
    const data = {
      username: 'hantsy',
      password: 'password',
      firstName: 'Hantsy',
      lastName: 'Bai',
      email: 'hantsy@gmail.com',
    };

    const result = registerSchema.parse(data);
    expect(result).toEqual(data);
  });

  it('should reject invalid email', () => {
    const data = {
      username: 'hantsy',
      password: 'password',
      email: 'invalid-email',
    };

    expect(() => registerSchema.parse(data)).toThrow();
  });

  it('should reject short password', () => {
    const data = {
      username: 'hantsy',
      password: 'short',
      email: 'hantsy@gmail.com',
    };

    expect(() => registerSchema.parse(data)).toThrow();
  });
});
