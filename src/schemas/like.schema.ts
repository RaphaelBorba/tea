import { Schema, Types } from 'mongoose';

export interface Like {
  _id: Types.ObjectId;
  userId: string;
  postId: Types.ObjectId;
  createdAt: Date;
}

export const LikeSchema = new Schema<Like>({
  userId: { type: String, required: true, index: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });


