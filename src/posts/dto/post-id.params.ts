import { IsMongoId } from 'class-validator';

export class PostIdParams {
  @IsMongoId()
  id!: string;
}


