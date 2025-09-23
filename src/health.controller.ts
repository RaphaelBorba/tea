import { Controller, Get, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis/redis.module';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    let mongo: 'up' | 'down' = 'down';
    let redis: 'up' | 'down' = 'down';

    // Mongo
    try {
      mongo = this.mongoConnection.readyState === 1 ? 'up' : 'down';
    } catch {
      mongo = 'down';
    }

    // Redis
    try {
      const pong = await this.redis.ping();
      redis = pong === 'PONG' ? 'up' : 'down';
    } catch {
      redis = 'down';
    }

    if (mongo !== 'up' || redis !== 'up') {
      throw new HttpException({ status: 'error', mongo, redis }, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { status: 'ok', mongo, redis };
  }
}


