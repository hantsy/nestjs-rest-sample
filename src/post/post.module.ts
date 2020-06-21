import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema } from './post.model';
import { PostDataInitializerService } from './post-data-initializer.service';
import { AuthenticationMiddleware } from 'src/authentication.middleware';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'posts', schema: PostSchema }])],
  controllers: [PostController],
  providers: [PostService, PostDataInitializerService],
})
export class PostModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(AuthenticationMiddleware).forRoutes(
      { method: RequestMethod.POST, path: '/posts' },
      { method: RequestMethod.PUT, path: '/posts/:id' },
      { method: RequestMethod.DELETE, path: '/posts/:id' }
    )
  }
}
