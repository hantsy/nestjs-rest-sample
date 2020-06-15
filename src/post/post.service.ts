import { Injectable } from '@nestjs/common';
import { Post } from './post.model';
import { from, Observable } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';

@Injectable()
export class PostService {
  constructor(@InjectModel('posts') private postModel: Model<Post>) {}

  findAll(keyword?: string, skip = 0, limit = 10): Observable<Post[]> {
    if (keyword) {
      return from(
        this.postModel
          .find({ title: { $regex: '.*' + keyword + '.*' } })
          .skip(skip)
          .limit(limit)
          .exec(),
      );
    } else {
      return from(
        this.postModel
          .find({})
          .skip(skip)
          .limit(limit)
          .exec(),
      );
    }
  }

  findById(id: string): Observable<Post> {
    return from(this.postModel.findOne({ _id: id }).exec());
  }

  save(data: CreatePostDto): Observable<Post> {
    const createPost = this.postModel.create({ ...data });
    return from(createPost);
  }

  update(id: string, data: UpdatePostDto): Observable<Post> {
    return from(this.postModel.findOneAndUpdate({ _id: id }, data).exec());
  }

  deleteById(id: string): Observable<Post> {
    return from(this.postModel.findOneAndDelete({ _id: id }).exec());
  }

  deleteAll(): Observable<any> {
    return from(this.postModel.deleteMany({}).exec());
  }
}
