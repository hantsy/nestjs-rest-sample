import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
import { Post } from '../database/post.model';
import { CreatePostDto } from './create-post.dto';

@Injectable()
export class PostDataInitializerService
  implements OnModuleInit, OnModuleDestroy {
  private data: CreatePostDto[] = [
    {
      title: 'Generate a NestJS project',
      content: 'content',
    },
    {
      title: 'Create CRUD RESTful APIs',
      content: 'content',
    },
    {
      title: 'Connect to MongoDB',
      content: 'content',
    },
  ];

  constructor(
    @Inject(POST_MODEL) private postModel: Model<Post>,
    @Inject(COMMENT_MODEL) private commentModel: Model<Comment>,
  ) {}

  onModuleInit(): void {
    console.log('(PostModule) is initialized...');
    this.postModel.insertMany(this.data).then((r) => console.log(r));
    // Promise.all(this.data.map((d) => this.postModel.create(d))).then((saved) =>
    //   console.log(saved),
    // );
  }

  onModuleDestroy(): void {
    Promise.all([
      this.postModel.deleteMany({}),
      this.commentModel.deleteMany({}),
    ]).then((data) => {
      console.log(data);
    });
  }
}
