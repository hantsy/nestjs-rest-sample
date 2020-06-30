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

  it('should contains expiresIn and secret key', async () => {
    expect(config.expiresIn).toBe('3600s');
    expect(config.secretKey).toBe('rzxlszyykpbgqcflzxsqcysyhljt');
  });
});
