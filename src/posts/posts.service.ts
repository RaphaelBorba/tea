import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly repo: PostsRepository) {}

  async create(authorId: string, dto: CreatePostDto) {
    const categoryId = dto.categoryId;
    if (!(await this.repo.categoryExists(categoryId))) {
      throw new BadRequestException('Invalid categoryId');
    }
    return this.repo.createPost({
      authorId,
      categoryId: new Types.ObjectId(categoryId),
      title: dto.title,
      content: dto.content,
    } as any);
  }

  async getById(id: string) {
    const doc = await this.repo.findByIdLean(id);
    if (!doc) return null;
    return {
      id: doc._id,
      authorId: doc.authorId,
      categoryId: doc.categoryId,
      title: doc.title,
      content: doc.content,
      likeCount: doc.likeCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async like(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    const post = await this.repo.findByIdLean(id);
    if (!post) throw new BadRequestException('Post not found');
    const res = await this.repo.likePost(userId, id);
    return { ok: true, liked: res.added };
  }

  async dislike(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    const post = await this.repo.findByIdLean(id);
    if (!post) throw new BadRequestException('Post not found');
    const res = await this.repo.dislikePost(userId, id);
    return { ok: true, disliked: res.removed };
  }
}


