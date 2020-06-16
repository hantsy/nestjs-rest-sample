import { of } from 'rxjs';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';

export class PostServiceStub {
    private posts = [
      {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'Generate a NestJS project',
        content: 'content',
      },
      {
        _id: '5ee49c3115a4e75254bb732f',
        title: 'Create CRUD RESTful APIs',
        content: 'content',
      },
      {
        _id: '5ee49c3115a4e75254bb7330',
        title: 'Connect to MongoDB',
        content: 'content',
      },
    ];

    findAll() {
      return of(this.posts);
    }

    findById(id: string) {
      const { title, content } = this.posts[0];
      return of({ _id: id, title, content });
    }

    save(data: CreatePostDto) {
      return of({ _id: this.posts[0]._id, ...data });
    }

    update(id: string, data: UpdatePostDto) {
      return of({ _id: id, ...data });
    }

    deleteById(id: string) {
      return of({ ...this.posts[0], _id: id });
    }
  }
