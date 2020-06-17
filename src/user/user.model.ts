import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ require: true })
  readonly username: string;

  @Prop({ require: true })
  readonly email: string;

  @Prop({ require: true })
  readonly password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
