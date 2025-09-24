/* eslint-disable no-console */
import 'reflect-metadata';
import { connect, connection, model } from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { CategorySchema, Category } from './schemas/category.schema';
import { PostSchema, Post } from './schemas/post.schema';
import { LikeSchema, Like } from './schemas/like.schema';

async function main() {
  ConfigModule.forRoot();
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tea_feed';
  await connect(mongoUri);

  const CategoryModel = model<Category>('Category', CategorySchema);
  const PostModel = model<Post>('Post', PostSchema);
  const LikeModel = model<Like>('Like', LikeSchema);

  console.log('Clearing collections...');
  await Promise.all([
    CategoryModel.deleteMany({}),
    PostModel.deleteMany({}),
    LikeModel.deleteMany({}),
  ]);

  const categoryNames = [
    'Technology', 'Science', 'Art', 'Music', 'Sports', 'Travel', 'Food', 'Gaming', 'Movies', 'Books', 'Health', 'Business',
  ];
  console.log('Inserting categories...');
  const categories = await CategoryModel.insertMany(categoryNames.map((name) => ({ name })));

  console.log('Generating posts...');
  const totalPosts = 5200;
  const postsToInsert: Omit<Post, '_id' | 'createdAt' | 'updatedAt'>[] = [] as any;
  const now = Date.now();
  for (let i = 0; i < totalPosts; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const createdAt = new Date(now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30));
    postsToInsert.push({
      authorId: `user_${Math.ceil(Math.random() * 200)}`,
      categoryId: category._id,
      title: `Post #${i + 1} in ${category.name}`,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      likeCount: 0,
      createdAt,
      updatedAt: createdAt,
    } as any);
  }
  const createdPosts = await PostModel.insertMany(postsToInsert, { ordered: false });

  console.log('Generating likes (heavy-tailed)...');
  const likesToInsert: Omit<Like, '_id' | 'createdAt'>[] = [] as any;
  for (const p of createdPosts) {
    // Zipf-like distribution: few hot posts, many cold
    const base = Math.random();
    let likes = Math.floor(Math.pow(base, 3) * 200); // up to ~200
    if (Math.random() < 0.02) likes += 500 + Math.floor(Math.random() * 500); // some very hot
    const usedUsers = new Set<string>();
    for (let k = 0; k < likes; k++) {
      const userId = `user_${Math.ceil(Math.random() * 5000)}`;
      const key = `${userId}:${p._id.toString()}`;
      if (usedUsers.has(key)) continue;
      usedUsers.add(key);
      likesToInsert.push({ userId, postId: p._id } as any);
    }
  }
  if (likesToInsert.length > 0) {
    await LikeModel.insertMany(likesToInsert, { ordered: false });
  }

  console.log('Updating like counts...');
  const agg = await LikeModel.aggregate([
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);
  const bulk = PostModel.collection.initializeUnorderedBulkOp();
  for (const { _id, count } of agg) {
    bulk.find({ _id }).updateOne({ $set: { likeCount: count } });
  }
  if ((bulk as any).length > 0) {
    await bulk.execute();
  }

  console.log('Seed completed');
  await connection.close();
}

main().catch(async (err) => {
  console.error(err);
  await connection.close();
  process.exit(1);
});


