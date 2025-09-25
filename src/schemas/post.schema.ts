import { Schema, Types } from 'mongoose';

export interface Post {
  _id: Types.ObjectId;
  authorId: string;
  categoryId: Types.ObjectId;
  title: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = new Schema<Post>({
  authorId: { type: String, required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  likeCount: { type: Number, default: 0, index: true },
}, { timestamps: true });

PostSchema.index({ createdAt: -1 });
PostSchema.index({ likeCount: -1, createdAt: -1 });
PostSchema.index({ categoryId: 1, likeCount: -1, createdAt: -1 });


