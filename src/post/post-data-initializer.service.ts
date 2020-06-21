import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Post } from 'src/database/post.model';
import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
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
    this.data.forEach(d => {
      this.postModel.create(d).then(saved => console.log(saved));
    });

    this.postModel
      .create({
        title: 'Model relations in Mongoose',
        content: 'content of Model relations in Mongoose',
      })
      .then(post =>
        this.commentModel.create({
          post: { _id: post._id },
          content: 'comment of Model relations in Mongoose',
        }),
      )
      .then(saved => console.log(saved));
  }

  onModuleDestroy(): void {
    console.log('(PostModule) is being destroyed...');
    this.postModel
      .deleteMany({})
      .then(del => console.log(`deleted ${del.deletedCount} rows of posts`));
    this.commentModel
      .deleteMany({})
      .then(del => console.log(`deleted ${del.deletedCount} rows of comments`));
  }
}
