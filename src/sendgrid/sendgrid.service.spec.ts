import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '@sendgrid/mail';
import { lastValueFrom } from 'rxjs';
import { SENDGRID_MAIL } from './sendgrid.constants';
import { SendgridService } from './sendgrid.service';

describe('SendgridService', () => {
  let service: SendgridService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendgridService,
        {
          provide: SENDGRID_MAIL,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SendgridService>(SendgridService);
    mailService = module.get<MailService>(SENDGRID_MAIL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('MailService should be defined', () => {
    expect(mailService).toBeDefined();
  });

  it('should call MailService.send', async () => {
    const msg = {
      to: 'test@example.com',
      from: 'test@example.com', // Use the email address or domain you verified above
      subject: 'Sending with Twilio SendGrid is Fun',
      text: 'and easy to do anywhere, even with Node.js',
      html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    const sendSpy = jest
      .spyOn(mailService, 'send')
      .mockResolvedValue({} as any);

    await lastValueFrom(service.send(msg));
    expect(sendSpy).toBeCalledTimes(1);
    expect(sendSpy).toBeCalledWith(msg, false);
  });
});
