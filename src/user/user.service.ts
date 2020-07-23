import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';
import { USER_MODEL } from '../database/database.constants';
import { User } from '../database/user.model';
import { Post } from '../database/post.model';

@Injectable()
export class UserService {
  constructor(@Inject(USER_MODEL) private userModel: Model<User>) { }

  findByUsername(username: string): Observable<User | undefined> {
    return from(this.userModel.findOne({ username }).exec());
  }

  findById(id: string, withPosts = false): Observable<User & { posts?: Post[] }> {
    const userQuery = this.userModel.findOne({ _id: id });
    if (withPosts) {
      userQuery.populate("posts");
    }
    return from(userQuery.exec());
  }
}
