import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProfileController } from './profile.controller';
import { UserDataInitializerService } from './user-data-initializer.service';
import { UserService } from './user.service';
@Module({
  imports: [DatabaseModule],
  providers: [UserService, UserDataInitializerService],
  exports: [UserService],
  controllers: [ProfileController],
})
export class UserModule {}
