import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secretKey: process.env.JWT_SECRET_KEY ?? 'rzxlszyykpbgqcflzxsqcysyhljt',
  expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
  refreshSecretKey:
    process.env.JWT_REFRESH_SECRET_KEY ??
    'refresh-rzxlszyykpbgqcflzxsqcysyhljt',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
