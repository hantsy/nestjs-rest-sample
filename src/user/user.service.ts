import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { from, Observable, EMPTY, of } from 'rxjs';
import { USER_MODEL } from '../database/database.constants';
import { User, UserModel } from '../database/user.model';
import { Post } from '../database/post.model';
import { flatMap, throwIfEmpty } from 'rxjs/operators';


@Injectable()
export class UserService {
  constructor(@Inject(USER_MODEL) private userModel: UserModel) { }

  findByUsername(username: string): Observable<User> {
    return from(this.userModel.findOne({ username }).exec());
  }

  findById(id: string, withPosts = false): Observable<User> {
    const userQuery = this.userModel.findOne({ _id: id });
    if (withPosts) {
      userQuery.populate("posts");
    }
    return from(userQuery.exec()).pipe(
      flatMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(() => new NotFoundException(`user:$id was not found`)),
    );
  }
}
