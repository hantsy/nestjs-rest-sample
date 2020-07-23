import { Controller, Get, Param, Req, Query, DefaultValuePipe } from '@nestjs/common';
import { Request } from 'express';
import { ParseObjectIdPipe } from '../post/parse-object-id.pipe';
import { UserService } from './user.service';
import { Observable } from 'rxjs';

@Controller({ path: "/users" })
export class UserController {

  constructor(private userService: UserService) { }

  @Get(':id')
  getUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('withPosts', new DefaultValuePipe(false)) withPosts?: boolean
  ): Observable<any> {
    return this.userService.findById(id, withPosts);
  }
}
