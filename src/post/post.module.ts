import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PostDataInitializerService } from './post-data-initializer.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PostController],
  providers: [PostService, PostDataInitializerService],
})
export class PostModule{}
//  implements NestModule {
//   configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
//     consumer
//       .apply(AuthenticationMiddleware)
//       .forRoutes(
//         { method: RequestMethod.POST, path: '/posts' },
//         { method: RequestMethod.PUT, path: '/posts/:id' },
//         { method: RequestMethod.DELETE, path: '/posts/:id' },
//       );
//   }
// }
