import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDataInitializerService } from './user-data-initializer.service';
import { DatabaseModule } from 'src/database/database.module';
@Module({
  imports: [DatabaseModule],
  providers: [
    UserService,
    UserDataInitializerService,
  ],
  exports: [UserService],
})
export class UserModule {}
