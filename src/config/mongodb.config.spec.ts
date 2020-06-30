import { ConfigModule, ConfigType } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import mongodbConfig from './mongodb.config';

describe('mongodbConfig', () => {
  let config: ConfigType<typeof mongodbConfig>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(mongodbConfig)],
    }).compile();

    config = module.get<ConfigType<typeof mongodbConfig>>(mongodbConfig.KEY);
  });

  it('should be defined', () => {
    expect(mongodbConfig).toBeDefined();
  });

  it('should contains uri key', async () => {
    expect(config.uri).toBe('mongodb://localhost/blog');
  });
});
