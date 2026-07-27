import { Injectable, Inject } from '@nestjs/common';
import { MailService, MailDataRequired, ClientResponse } from '@sendgrid/mail';
import { SENDGRID_MAIL } from './sendgrid.constants';
import { Observable, from } from 'rxjs';

@Injectable()
export class SendgridService {
  constructor(
    @Inject(SENDGRID_MAIL) private readonly mailService: MailService,
  ) {}

  send(data: MailDataRequired): Observable<[ClientResponse, {}]> {
    return from(this.mailService.send(data, false));
  }
}
