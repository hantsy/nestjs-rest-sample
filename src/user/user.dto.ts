import { RoleType } from '../shared/enum/role-type.enum';

export class UserDto {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: RoleType[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
