import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

// Simple sliding window (2 windows) per user+route using Redis counters
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private windowSeconds = 60; // 1 minute
  private maxRequests = 100; // adjust as desired

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const path: string = req.path || req.originalUrl || '';

    // public route
    if (path === '/health') return true;

    const userId: string | undefined = req.headers['x-user-id'];
    const client = (typeof userId === 'string' && userId.trim().length > 0) ? userId : 'anonymous';
    const routeKey = `${req.method}:${path}`;

    const nowSec = Math.floor(Date.now() / 1000);
    const curWindow = Math.floor(nowSec / this.windowSeconds);
    const curKey = `rl:${routeKey}:${client}:${curWindow}`;
    const pipe = this.redis.multi();
    
    pipe.incr(curKey);
    pipe.expire(curKey, this.windowSeconds + 1);
    const results = await pipe.exec();
    const current = results && results[0] && results[0][1] ? Number(results[0][1]) : 0;

    if (current > this.maxRequests) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}


