import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';

@Injectable()
export class UserDataInitializerService
  implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectModel('users') private userModel: Model<User>) {}
  onModuleInit(): void {
    console.log('(UserModule) is initialized...');
    this.userModel
      .create({
        username: 'hantsy',
        password: 'password',
        email: 'hantsy@example.com',
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
