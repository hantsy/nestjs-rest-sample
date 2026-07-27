import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPrincipal } from '../../auth/interface/user-principal.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPrincipal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
