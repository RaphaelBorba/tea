import { Inject, Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import type Redis from 'ioredis';

const CATEGORIES_CACHE_TTL_SECONDS = 300;

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,

  ) {}

  async getAll() {
    const cacheKey = 'cache:categories';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const docs = await this.repo.findAllLean();
    await this.redis.set(cacheKey, JSON.stringify(docs), 'EX', CATEGORIES_CACHE_TTL_SECONDS);
    return docs.map((c) => ({ id: c._id, name: c.name }));
  }
}


