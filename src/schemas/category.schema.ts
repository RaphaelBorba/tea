import { Schema, Types } from 'mongoose';

export interface Category {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<Category>({
  name: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });


