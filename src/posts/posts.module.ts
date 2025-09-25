import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { PostSchema } from '../schemas/post.schema';
import { CategorySchema } from '../schemas/category.schema';
import { LikeSchema } from '../schemas/like.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Post', schema: PostSchema },
      { name: 'Category', schema: CategorySchema },
      { name: 'Like', schema: LikeSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}


