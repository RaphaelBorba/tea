import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { Post } from './schemas/post.schema';
import type { Category } from './schemas/category.schema';
import type { Like } from './schemas/like.schema';

@Injectable()
export class IndexSyncService implements OnModuleInit {
  private readonly logger = new Logger(IndexSyncService.name);

  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Like') private readonly likeModel: Model<Like>,
  ) {}

  async onModuleInit() {
    const shouldSync = (process.env.SYNC_INDEXES ?? 'false').toLowerCase() === 'true';
    if (!shouldSync) {
      this.logger.log('Skipping index sync (SYNC_INDEXES is not true)');
      return;
    }
    this.logger.log('Syncing MongoDB indexes...');
    await Promise.all([
      this.postModel.syncIndexes(),
      this.categoryModel.syncIndexes(),
      this.likeModel.syncIndexes(),
    ]);
    this.logger.log('Index sync completed');
  }
}


