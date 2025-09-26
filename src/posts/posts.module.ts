import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema } from '../schemas/post.schema';
import { CategorySchema } from '../schemas/category.schema';
import { IndexSyncService } from '../index-sync.service';
import { LikeSchema } from '../schemas/like.schema';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Post', schema: PostSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Like', schema: LikeSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository, IndexSyncService],
})
export class PostsModule {}


