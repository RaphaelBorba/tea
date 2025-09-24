import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Post } from '../schemas/post.schema';
import type { Category } from '../schemas/category.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
  ) {}

  async categoryExists(categoryId: string): Promise<boolean> {
    return (await this.categoryModel.exists({ _id: new Types.ObjectId(categoryId) })) != null;
  }

  async createPost(doc: Pick<Post, 'authorId' | 'categoryId' | 'title' | 'content'>) {
    const created = await this.postModel.create(doc as any);
    return created.toObject();
  }

  async findByIdLean(id: string) {
    return this.postModel.findById(id).lean();
  }
}


