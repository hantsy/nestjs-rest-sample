import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { async } from 'rxjs/internal/scheduler/async';
import { Post } from '../../dist/post/post.interface';

//jest.mock('./post.service');

describe('Post Controller', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService],
      controllers: [PostController],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET on /posts should return all posts', async () => {
    const posts = await controller.getAllPosts().toPromise();
    expect(posts.length).toBe(3);
  });

  it('GET on /posts/1 should return one post ', done => {
    controller.getPostById(1).subscribe(data => {
      expect(data.id).toEqual(1);
      done();
    });
  });

  it('POST on /posts should return all posts', async () => {
    const post:Post = {id:4, title:'test title', content:'test content'};
    const posts = await controller.createPost(post).toPromise();
    expect(posts.length).toBe(4);
  });

  it('PUT on /posts/1 should return all posts', done => {
    const post:Post = {id:4, title:'test title', content:'test content'};
    controller.updatePost(1, post).subscribe(data => {
      expect(data.length).toBe(3);
      expect(data[0].title).toEqual('test title');
      expect(data[0].content).toEqual('test content');
      expect(data[0].updatedAt).toBeTruthy();
      done();
    });
  });

  it('DELETE on /posts/1 should return true', done => {
    controller.deleteById(1).subscribe(data => {
      expect(data).toBeTruthy();
      done();
    });
  });

  it('DELETE on /posts/1001 should return false', done => {
    controller.deleteById(1001).subscribe(data => {
      expect(data).toBeFalsy();
      done();
    });
  });
});
