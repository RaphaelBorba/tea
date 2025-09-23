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
}


