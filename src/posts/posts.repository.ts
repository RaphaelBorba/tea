import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Post } from '../schemas/post.schema';
import type { Category } from '../schemas/category.schema';
import type { Like } from '../schemas/like.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Like') private readonly likeModel: Model<Like>,
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

  async likePost(userId: string, postId: string) {
    const postObjectId = new Types.ObjectId(postId);
    const created = await this.likeModel.findOneAndUpdate(
      { userId, postId: postObjectId },
      { $setOnInsert: { userId, postId: postObjectId } },
      { upsert: true, new: false },
    );
    if (created == null) {
      // like inserted (new: false means previous doc not returned on insert)
      await this.postModel.updateOne({ _id: postObjectId }, { $inc: { likeCount: 1 } });
      return { added: true } as const;
    }
    return { added: false } as const;
  }

  async dislikePost(userId: string, postId: string) {
    const postObjectId = new Types.ObjectId(postId);
    const res = await this.likeModel.findOneAndDelete({ userId, postId: postObjectId });
    if (res) {
      await this.postModel.updateOne({ _id: postObjectId }, { $inc: { likeCount: -1 } });
      return { removed: true } as const;
    }
    return { removed: false } as const;
  }
}


