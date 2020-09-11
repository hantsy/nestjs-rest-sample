import { RoleType } from "../../shared/enum/role-type.enum";

export interface JwtPayload {
    readonly upn: string;
    readonly sub: string;
    readonly email: string;
    readonly roles: RoleType[];
  }
