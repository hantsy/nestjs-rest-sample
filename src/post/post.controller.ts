import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  Scope,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleType } from '../shared/enum/role-type.enum';
import { HasRoles } from '../auth/guard/has-roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { ParseObjectIdPipe } from '../shared/pipe/parse-object-id.pipe';
import { Comment } from '../database/comment.model';
import { Post as BlogPost } from '../database/post.model';
import { CreateCommentDto } from './create-comment.dto';
import { CreatePostDto } from './create-post.dto';
import { PostService } from './post.service';
import { UpdatePostDto } from './update-post.dto';

@ApiTags('posts')
@Controller({ path: 'posts', scope: Scope.REQUEST })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('')
  @ApiQuery({ name: 'q', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page size',
    example: 10,
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Offset',
    example: 0,
  })
  @ApiOkResponse({ description: 'List of posts.' })
  getAllPosts(
    @Query('q') keyword?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Observable<BlogPost[]> {
    return this.postService.findAll(keyword, skip, limit);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Post found.' })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  getPostById(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Observable<BlogPost> {
    return this.postService.findById(id);
  }

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Post created.' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
  createPost(
    @Body() post: CreatePostDto,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.save(post).pipe(
      map((post) => {
        return res
          .location('/api/v1/posts/' + post._id)
          .status(201)
          .send();
      }),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Post updated.' })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  updatePost(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() post: UpdatePostDto,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.update(id, post).pipe(
      map(() => {
        return res.status(204).send();
      }),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiNoContentResponse({ description: 'Post deleted.' })
  @ApiNotFoundResponse({ description: 'Post not found.' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiForbiddenResponse({ description: 'Admin role required.' })
  deletePostById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.deleteById(id).pipe(
      map(() => {
        return res.status(204).send();
      }),
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Comment created.' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  createCommentForPost(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() data: CreateCommentDto,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.createCommentFor(id, data).pipe(
      map((comment) => {
        return res
          .location('/api/v1/posts/' + id + '/comments/' + comment._id)
          .status(201)
          .send();
      }),
    );
  }

  @Get(':id/comments')
  @ApiOkResponse({ description: 'List of comments for the post.' })
  getAllCommentsOfPost(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Observable<Comment[]> {
    return this.postService.commentsOf(id);
  }
}
