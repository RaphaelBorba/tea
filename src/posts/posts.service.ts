import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { score } from './score.util';

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

  async feed(query: FeedQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));
    const skip = (page - 1) * limit;
    const { items, total } = await this.repo.findFeed({ categoryId: query.categoryId, skip, limit });

    const fresh = (query.fresh ?? 'false') === 'true';
    const now = Date.now();
    const scored = items.map((p) => ({
      id: p._id,
      authorId: p.authorId,
      categoryId: p.categoryId,
      title: p.title,
      content: p.content,
      likeCount: p.likeCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      score: score(p.likeCount ?? 0, new Date(p.createdAt), fresh ? { now } : { now, freshnessHalfLifeHours: 1e9 }),
    }));
    // If freshness off, we keep ranking by likeCount/createdAt from repo sort
    // If freshness on, optionally re-sort by score desc
    const finalItems = fresh ? scored.sort((a, b) => b.score - a.score) : scored;
    return {
      page,
      limit,
      total,
      items: finalItems,
    };
  }
}


