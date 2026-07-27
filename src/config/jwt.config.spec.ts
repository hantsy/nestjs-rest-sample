import { ConfigModule, ConfigType } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import jwtConfig from './jwt.config';

describe('jwtConfig', () => {
  let config: ConfigType<typeof jwtConfig>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(jwtConfig)],
    }).compile();

    config = module.get<ConfigType<typeof jwtConfig>>(jwtConfig.KEY);
  });

  it('should be defined', () => {
    expect(jwtConfig).toBeDefined();
  });

  it('should contain JWT config values', async () => {
    expect(config.secretKey).toBe('rzxlszyykpbgqcflzxsqcysyhljt');
    expect(config.expiresIn).toBe('3600s');
    expect(config.refreshSecretKey).toBe(
      'refresh-rzxlszyykpbgqcflzxsqcysyhljt',
    );
    expect(config.refreshExpiresIn).toBe('7d');
  });
});
