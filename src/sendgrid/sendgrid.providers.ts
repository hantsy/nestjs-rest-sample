import { ConfigType } from '@nestjs/config';
import { MailService } from '@sendgrid/mail';
import sendgridConfig from '../config/sendgrid.config';
import { SENDGRID_MAIL } from './sendgrid.constants';

export const sendgridProviders = [
    {
      provide: SENDGRID_MAIL,
      useFactory: (config: ConfigType<typeof sendgridConfig>): MailService =>
        {
            const mail = new MailService();
            mail.setApiKey(config.apiKey);
            mail.setTimeout(5000);
            //mail.setTwilioEmailAuth(username, password)
            return mail;
        },
      inject: [sendgridConfig.KEY],
    }
  ];
