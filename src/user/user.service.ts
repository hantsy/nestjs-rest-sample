import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EMPTY, from, Observable, of, throwError } from 'rxjs';
import { mergeMap, tap, throwIfEmpty, catchError } from 'rxjs/operators';
import { RoleType } from '../shared/enum/role-type.enum';
import { USER_MODEL } from '../database/database.constants';
import { User, UserModel } from '../database/user.model';
import { SendgridService } from '../sendgrid/sendgrid.service';
import { RegisterDto } from './register.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_MODEL) private userModel: UserModel,
    private sendgridService: SendgridService
  ) { }

  findByUsername(username: string): Observable<User> {
    return from(this.userModel.findOne({ username }).exec());
  }

  existsByUsername(username: string): Observable<boolean> {
    return from(this.userModel.exists({ username }));
  }

  existsByEmail(email: string): Observable<boolean> {
    return from(this.userModel.exists({ email }));
  }

  register(data: RegisterDto): Observable<User> {

    // Simply here we can send a verification email to the new registered user
    // by calling SendGrid directly.
    //
    // In a microservice application, you can send this msg to a message broker
    // then subsribe it in antoher (micro)service and send the emails.

    // Use base64 to genrate a random string
    // const randomCode = btoa(Math.random().toString()).slice(0, 4);
    // console.log(`random code:${randomCode}`);

    // const created = this.userModel.create({
    //   ...data,
    //   verified: false,
    //   verifyCode: randomCode,
    //   roles: [RoleType.USER]
    // });

    //  Sendgrid can manage email templates, use an existing template is more reasonable.
    //
    // const msg = {
    //   to: data.email,
    //   from: 'no-reply@example.com', // Use the email address or domain you verified above
    //   subject: 'Welcome to Nestjs Sample',
    //   text: `verification code:${randomCode}`,
    //   html: `<strong>verification code:${randomCode}</strong>`,
    // };
    // this.sendgridService.send(msg)
    //   .subscribe({
    //     next: data => console.log(`${data}`),
    //     error: error => console.log(`${error}`)
    //   });

    const created = this.userModel.create({
      ...data,
      roles: [RoleType.USER]
    });

    return from(created);

    // const msg = {
    //   from: 'hantsy@gmail.com', // Use the email address or domain you verified above
    //   subject: 'Welcome to Nestjs Sample',
    //   templateId: "d-cc6080999ac04a558d632acf2d5d0b7a",
    //   personalizations: [
    //     {
    //       to: data.email,
    //       dynamicTemplateData: { name: data.firstName + ' ' + data.lastName },
    //     }
    //   ]

    // };
    // return this.sendgridService.send(msg).pipe(
    //   catchError(err=>of(`sending email failed:${err}`)),
    //   tap(data => console.log(data)),
    //   mergeMap(data => from(created)),
    // );
  }

  findById(id: string, withPosts = false): Observable<User> {
    const userQuery = this.userModel.findOne({ _id: id });
    if (withPosts) {
      userQuery.populate("posts");
    }
    return from(userQuery.exec()).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(() => new NotFoundException(`user:${id} was not found`)),
    );
  }
}
