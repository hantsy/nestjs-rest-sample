import { User } from 'src/database/user.model';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  readonly user: User;
}
