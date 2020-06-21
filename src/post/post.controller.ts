import {
  Controller,
  Query,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Scope,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PostService } from './post.service';
import { Post as BlogPost } from '../database/post.model';
import { UpdatePostDto } from './update-post.dto';
import { CreatePostDto } from './create-post.dto';
import { CreateCommentDto } from './create-comment.dto';
import { Comment } from '../database/comment.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { HasRoles } from '../auth/has-roles.decorator';
import { RoleType } from '../database/role-type.enum';

@Controller({path:'posts', scope:Scope.REQUEST})
export class PostController {
  constructor(private postService: PostService) {}

  @Get('')
  getAllPosts(
    @Query('q') keyword?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Observable<BlogPost[]> {
    return this.postService.findAll(keyword, skip, limit);
  }

  @Get(':id')
  getPostById(@Param('id') id: string): Observable<BlogPost> {
    return this.postService.findById(id);
  }

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  createPost(@Body() post: CreatePostDto): Observable<BlogPost> {
    return this.postService.save(post);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  updatePost(
    @Param('id') id: string,
    @Body() post: UpdatePostDto,
  ): Observable<BlogPost> {
    return this.postService.update(id, post);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.ADMIN)
  deletePostById(@Param('id') id: string): Observable<BlogPost> {
    return this.postService.deleteById(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER)
  createCommentForPost(
    @Param('id') id: string,
    @Body() data: CreateCommentDto,
  ): Observable<Comment> {
    return this.postService.createCommentFor(id, data);
  }

  @Get(':id/comments')
  getAllCommentsOfPost(@Param('id') id: string): Observable<Comment[]> {
    return this.postService.commentsOf(id);
  }
}
