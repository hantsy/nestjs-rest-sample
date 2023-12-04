import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { EMPTY, from, Observable, of } from 'rxjs';
import { mergeMap, throwIfEmpty } from 'rxjs/operators';
import { AuthenticatedRequest } from '../auth/interface/authenticated-request.interface';
import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
import { Post } from '../database/post.model';
import { CreateCommentDto } from './create-comment.dto';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';

@Injectable({ scope: Scope.REQUEST })
export class PostService {
  constructor(
    @Inject(POST_MODEL) private postModel: Model<Post>,
    @Inject(COMMENT_MODEL) private commentModel: Model<Comment>,
    @Inject(REQUEST) private req: AuthenticatedRequest,
  ) { }

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

  findById(id: string): Observable<Post> {
    return from(this.postModel.findOne({ _id: id }).exec()).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(() => new NotFoundException(`post:$id was not found`)),
    );
  }

  save(data: CreatePostDto): Observable<Post> {
    //console.log('req.user:'+JSON.stringify(this.req.user));
    const createPost: Promise<Post> = this.postModel.create({
      ...data,
      createdBy: { _id: this.req.user.id },
    });
    return from(createPost);
  }

  update(id: string, data: UpdatePostDto): Observable<Post> {
    return from(
      this.postModel
        .findOneAndUpdate(
          { _id: id },
          { ...data, updatedBy: { _id: this.req.user.id } },
          { new: true },
        )
        .exec(),
    ).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(() => new NotFoundException(`post:$id was not found`)),
    );
    // const filter = { _id: id };
    // const update = { ...data, updatedBy: { _id: this.req.user.id } };
    // return from(this.postModel.findOne(filter).exec()).pipe(
    //   mergeMap((post) => (post ? of(post) : EMPTY)),
    //   throwIfEmpty(() => new NotFoundException(`post:$id was not found`)),
    //   switchMap((p, i) => {
    //     return from(this.postModel.updateOne(filter, update).exec());
    //   }),
    //   map((res) => res.nModified),
    // );
  }

  deleteById(id: string): Observable<Post> {
    return from(this.postModel.findOneAndDelete({ _id: id }).exec()).pipe(
      mergeMap((p) => (p ? of(p.value) : EMPTY)),
      throwIfEmpty(() => new NotFoundException(`post:$id was not found`)),
    );
    // const filter = { _id: id };
    // return from(this.postModel.findOne(filter).exec()).pipe(
    //   mergeMap((post) => (post ? of(post) : EMPTY)),
    //   throwIfEmpty(() => new NotFoundException(`post:$id was not found`)),
    //   switchMap((p, i) => {
    //     return from(this.postModel.deleteOne(filter).exec());
    //   }),
    //   map((res) => res.deletedCount),
    // );
  }

  deleteAll(): Observable<any> {
    return from(this.postModel.deleteMany({}).exec());
  }

  //  actions for comments
  createCommentFor(id: string, data: CreateCommentDto): Observable<Comment> {
    const createdComment: Promise<Comment> = this.commentModel.create({
      post: { _id: id },
      ...data,
      createdBy: { _id: this.req.user.id },
    });
    return from(createdComment);
  }

  commentsOf(id: string): Observable<Comment[]> {
    const comments = this.commentModel
      .find({
        post: { _id: id },
      })
      .select('-post')
      .exec();
    return from(comments);
  }
}
