import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { Category } from '../schemas/category.schema';

@Injectable()
export class CategoriesRepository {
  constructor(@InjectModel('Category') private readonly categoryModel: Model<Category>) {}

  async findAllLean(): Promise<Array<{ _id: any; name: string }>> {
    return this.categoryModel.find({}, { name: 1 }).sort({ name: 1 }).lean();
  }
}


