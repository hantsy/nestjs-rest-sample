import { Injectable, Inject } from '@nestjs/common';
import { MailService, MailDataRequired } from '@sendgrid/mail';
import { SENDGRID_MAIL } from './sendgrid.constants';
import { Observable, from } from 'rxjs';

@Injectable()
export class SendgridService {

    constructor(@Inject(SENDGRID_MAIL) private mailService: MailService) { }

    send(data: MailDataRequired): Observable<any>{
        //console.log(this.mailService)
        return from(this.mailService.send(data, false))
    }

}
