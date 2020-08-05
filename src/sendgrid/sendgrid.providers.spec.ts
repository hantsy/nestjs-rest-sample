import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '@sendgrid/mail';
import sendgridConfig from '../config/sendgrid.config';
import { SENDGRID_MAIL } from './sendgrid.constants';
import { sendgridProviders } from './sendgrid.providers';

describe('SendgridProviders', () => {
  let provider: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(sendgridConfig)],
      providers: [...sendgridProviders],
    }).compile();

    provider = module.get<MailService>(SENDGRID_MAIL);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
