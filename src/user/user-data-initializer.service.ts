import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { USER_MODEL } from '../database/database.constants';
import { RoleType } from '../database/role-type.enum';
import { User } from '../database/user.model';

@Injectable()
export class UserDataInitializerService
  implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(USER_MODEL) private userModel: Model<User>) {}

  onModuleInit(): void {
    console.log('(UserModule) is initialized...');
    const user = {
      username: 'hantsy',
      password: 'password',
      email: 'hantsy@example.com',
      roles: [RoleType.USER],
    };

    const admin = {
      username: 'admin',
      password: 'password',
      email: 'admin@example.com',
      roles: [RoleType.ADMIN],
    };

    [user, admin].map((u) =>
      this.userModel.create(u).then((data) => console.log(data)),
    );
  }

  onModuleDestroy(): void {
    this.userModel.deleteMany({}).then((del) => {
      console.log(`deleted ${del.deletedCount} rows`);
    });
  }
}
