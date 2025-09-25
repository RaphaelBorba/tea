import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { score } from './score.util';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const FEED_CACHE_TTL_SECONDS = 60;
const POST_CACHE_TTL_SECONDS = 300;

@Injectable()
export class PostsService {
  constructor(
    private readonly repo: PostsRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

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

    const cacheKey = `cache:post:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const doc = await this.repo.findByIdLean(id);
    if (!doc) return null;
    const result = {
      id: doc._id,
      authorId: doc.authorId,
      categoryId: doc.categoryId,
      title: doc.title,
      content: doc.content,
      likeCount: doc.likeCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } as const;

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', POST_CACHE_TTL_SECONDS);
    return result;
  }

  async like(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    const post = await this.repo.findByIdLean(id);
    if (!post) throw new BadRequestException('Post not found');
    const res = await this.repo.likePost(userId, id);

    await Promise.all([
      this.redis.del(`cache:post:${id}`),
      this.invalidateFeedCaches(String(post.categoryId)),
    ]);
    return { ok: true, liked: res.added };
  }

  async dislike(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    const post = await this.repo.findByIdLean(id);
    if (!post) throw new BadRequestException('Post not found');
    const res = await this.repo.dislikePost(userId, id);

    await Promise.all([
      this.redis.del(`cache:post:${id}`),
      this.invalidateFeedCaches(String(post.categoryId)),
    ]);
    return { ok: true, disliked: res.removed };
  }

  async feed(query: FeedQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 10)));
    const skip = (page - 1) * limit;
    const cacheKey = this.buildFeedCacheKey({
      categoryId: query.categoryId ?? 'all',
      fresh: (query.fresh ?? 'false') === 'true',
      page,
      limit,
    });
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

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

    const finalItems = fresh ? scored.sort((a, b) => b.score - a.score) : scored;
    const response = {
      page,
      limit,
      total,
      items: finalItems,
    } as const;

    await this.redis.set(cacheKey, JSON.stringify(response), 'EX', FEED_CACHE_TTL_SECONDS);
    return response;
  }

  private buildFeedCacheKey(params: { categoryId: string; fresh: boolean; page: number; limit: number }) {
    return `cache:feed:cat:${params.categoryId}:fresh:${params.fresh ? 1 : 0}:page:${params.page}:limit:${params.limit}`;
  }

  private async invalidateFeedCaches(categoryId: string) {
    const patterns = [
      `cache:feed:cat:${categoryId}:*`,
      'cache:feed:cat:all:*',
    ];
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) await this.redis.del(...keys);
    }
  }
}


