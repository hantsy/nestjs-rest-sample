import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { RoleType } from '../database/role-type.enum';
import { USER_MODEL } from '../database/database.constants';
import { User } from '../database/user.model';

@Injectable()
export class UserDataInitializerService
  implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(USER_MODEL) private userModel: Model<User>) {
    //console.log(`userModel in UserDataInitializerService:${userModel}`);
  }
  onModuleInit(): void {
    console.log('(UserModule) is initialized...');
    this.userModel
      .create({
        username: 'hantsy',
        password: 'password',
        email: 'hantsy@example.com',
        roles: [RoleType.USER],
      })
      .then(data => console.log(data));
  }
  onModuleDestroy(): void {
    console.log('(UserModule) is being destroyed...');
    this.userModel
      .deleteMany({})
      .then(del => console.log(`deleted ${del.deletedCount} rows`));
  }
}
