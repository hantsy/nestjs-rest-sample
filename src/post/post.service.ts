import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model, Types } from 'mongoose';
import { EMPTY, from, Observable, of } from 'rxjs';
import { mergeMap, throwIfEmpty } from 'rxjs/operators';
import type { AuthenticatedRequest } from '../auth/interface/authenticated-request.interface';
import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
import { Post } from '../database/post.model';
import { CreateCommentDto } from './create-comment.dto';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';

@Injectable({ scope: Scope.REQUEST })
export class PostService {
  constructor(
    @Inject(POST_MODEL) private readonly postModel: Model<Post>,
    @Inject(COMMENT_MODEL) private readonly commentModel: Model<Comment>,
    @Inject(REQUEST) private readonly req: AuthenticatedRequest,
  ) {}

  findAll(keyword?: string, skip = 0, limit = 10): Observable<Post[]> {
    if (keyword) {
      return from(
        this.postModel
          .find({ title: { $regex: '.*' + keyword + '.*' } })
          .skip(skip)
          .limit(limit)
          .exec(),
      );
    } else {
      return from(this.postModel.find({}).skip(skip).limit(limit).exec());
    }
  }

  /**
   * Emits the matching post, or errors with NotFoundException (POST_NOT_FOUND)
   * if absent.
   * Database query errors propagate through the observable unchanged.
   */
  findById(id: string): Observable<Post> {
    return from(this.postModel.findOne({ _id: id }).exec()).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(
        () =>
          new NotFoundException(`post:${id} was not found`, {
            errorCode: 'POST_NOT_FOUND',
          }),
      ),
    );
  }

  save(data: CreatePostDto): Observable<Post> {
    const createPost: Promise<Post> = this.postModel.create({
      ...data,
      createdBy: new Types.ObjectId(this.req.user.id),
    });
    return from(createPost);
  }

  /**
   * Updates the post's supplied fields, records the current user as updatedBy,
   * and emits the updated document. Errors with NotFoundException (POST_NOT_FOUND)
   * if absent; database errors propagate unchanged. An invalid current user ID
   * throws during ObjectId conversion before an observable is returned.
   */
  update(id: string, data: UpdatePostDto): Observable<Post> {
    return from(
      this.postModel
        .findOneAndUpdate(
          { _id: id },
          {
            ...data,
            updatedBy: new Types.ObjectId(this.req.user.id),
          },
          { returnDocument: 'after' },
        )
        .exec(),
    ).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(
        () =>
          new NotFoundException(`post:${id} was not found`, {
            errorCode: 'POST_NOT_FOUND',
          }),
      ),
    );
  }

  /**
   * Deletes and emits the matching post, leaving its comments intact.
   * Errors with NotFoundException (POST_NOT_FOUND) if absent; database errors
   * propagate through the observable unchanged.
   */
  deleteById(id: string): Observable<Post> {
    return from(this.postModel.findOneAndDelete({ _id: id }).exec()).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(
        () =>
          new NotFoundException(`post:${id} was not found`, {
            errorCode: 'POST_NOT_FOUND',
          }),
      ),
    );
  }

  deleteAll(): Observable<any> {
    return from(this.postModel.deleteMany({}).exec());
  }

  //  actions for comments
  createCommentFor(id: string, data: CreateCommentDto): Observable<Comment> {
    const createdComment: Promise<Comment> = this.commentModel.create({
      post: new Types.ObjectId(id),
      ...data,
      createdBy: new Types.ObjectId(this.req.user.id),
    });
    return from(createdComment);
  }

  commentsOf(id: string): Observable<Comment[]> {
    const comments = this.commentModel
      .find({
        post: new Types.ObjectId(id),
      })
      .select('-post')
      .exec();
    return from(comments);
  }
}
