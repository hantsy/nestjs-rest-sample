import { RoleType } from '../database/role-type.enum';

export interface UserPrincipal {
  readonly username: string;
  readonly id: string;
  readonly email: string;
  readonly roles: RoleType[];
}
