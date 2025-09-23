import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async getAll() {
    const docs = await this.repo.findAllLean();
    return docs.map((c) => ({ id: c._id, name: c.name }));
  }
}


