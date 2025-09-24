import { Body, Controller, Get, Headers, Param, Post, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostIdParams } from './dto/post-id.params';

@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Post()
  async create(@Headers('x-user-id') userId: string | undefined, @Body() dto: CreatePostDto) {
    if (!userId) return { error: 'Missing X-User-Id header' };
    const created = await this.service.create(userId, dto);
    return { id: created._id, ...created };
  }

  @Get(':id')
  async getOne(@Param() params: PostIdParams) {
    const post = await this.service.getById(params.id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}


