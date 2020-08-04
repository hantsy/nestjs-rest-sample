import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProfileController } from './profile.controller';
import { UserDataInitializerService } from './user-data-initializer.service';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RegisterController } from './register.controller';
import { SendgridModule } from '../sendgrid/sendgrid.module';
@Module({
  imports: [DatabaseModule, SendgridModule],
  providers: [UserService, UserDataInitializerService],
  exports: [UserService],
  controllers: [ProfileController, UserController, RegisterController],
})
export class UserModule {}
