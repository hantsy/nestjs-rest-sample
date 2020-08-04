import { Module } from '@nestjs/common';
import { sendgridProviders } from './sendgrid.providers';
import { SendgridService } from './sendgrid.service';
import { ConfigModule } from '@nestjs/config';
import sendgridConfig from '../config/sendgrid.config';

@Module({
  imports: [ConfigModule.forFeature(sendgridConfig)],
  providers: [...sendgridProviders, SendgridService],
  exports: [...sendgridProviders, SendgridService]
})
export class SendgridModule { }
