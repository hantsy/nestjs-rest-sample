import {
  Inject,
  Injectable,
  OnModuleInit
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
import { Post } from '../database/post.model';
import { CreatePostDto } from './create-post.dto';

@Injectable()
export class PostDataInitializerService
  implements OnModuleInit {
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
  ) { }

  async onModuleInit(): Promise<void> {
    console.log('(PostModule) is initialized...');
    await this.postModel.deleteMany({});
    await this.commentModel.deleteMany({});
    await this.postModel.insertMany(this.data).then((r) => console.log(r));
  }
}
