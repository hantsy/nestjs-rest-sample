import { RoleType } from '../enum/role-type.enum';

export interface UserPrincipal {
  readonly username: string;
  readonly id: string;
  readonly email: string;
  readonly roles: RoleType[];
}
