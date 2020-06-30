import { Request } from 'express';
import { UserPrincipal } from './user-principal.interface';

export interface AuthenticatedRequest extends Request {
  readonly user: UserPrincipal;
}
