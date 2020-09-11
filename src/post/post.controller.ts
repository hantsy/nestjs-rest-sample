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
  UseGuards
} from '@nestjs/common';
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

@Controller({ path: 'posts', scope: Scope.REQUEST })
export class PostController {
  constructor(private postService: PostService) { }

  @Get('')
  getAllPosts(
    @Query('q') keyword?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Observable<BlogPost[]> {
    return this.postService.findAll(keyword, skip, limit);
  }

  @Get(':id')
  getPostById(@Param('id', ParseObjectIdPipe) id: string): Observable<BlogPost> {
    return this.postService.findById(id);
  }

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  createPost(
    @Body() post: CreatePostDto,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.save(post).pipe(
      map((post) => {
        return res
          .location('/posts/' + post._id)
          .status(201)
          .send();
      }),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  updatePost(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() post: UpdatePostDto,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.update(id, post).pipe(
      map((post) => {
        return res.status(204).send();
      }),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.ADMIN)
  deletePostById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.deleteById(id).pipe(
      map((post) => {
        return res.status(204).send();
      }),
    );
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER)
  createCommentForPost(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() data: CreateCommentDto,
    @Res() res: Response,
  ): Observable<Response> {
    return this.postService.createCommentFor(id, data).pipe(
      map((comment) => {
        return res
          .location('/posts/' + id + '/comments/' + comment._id)
          .status(201)
          .send();
      }),
    );
  }

  @Get(':id/comments')
  getAllCommentsOfPost(@Param('id', ParseObjectIdPipe) id: string): Observable<Comment[]> {
    return this.postService.commentsOf(id);
  }
}
