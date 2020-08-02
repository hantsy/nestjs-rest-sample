import { ConfigModule, ConfigType } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import sendgridConfig from './sendgrid.config';

describe('sendgridConfig', () => {
  let config: ConfigType<typeof sendgridConfig>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(sendgridConfig)],
    }).compile();

    config = module.get<ConfigType<typeof sendgridConfig>>(sendgridConfig.KEY);
  });

  it('should be defined', () => {
    expect(sendgridConfig).toBeDefined();
  });

  it('should contains expiresIn and secret key', async () => {
    expect(config.apiKey).toBeTruthy();
  });
});
