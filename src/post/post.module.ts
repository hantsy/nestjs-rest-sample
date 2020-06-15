import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema } from './post.model';
import { DataInitializerService } from './data-initializer.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'posts', schema: PostSchema }])],
  controllers: [PostController],
  providers: [PostService, DataInitializerService],
})
export class PostModule {}
