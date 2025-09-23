import { IsMongoId, IsString, Length } from 'class-validator';

export class CreatePostDto {
  @IsMongoId()
  categoryId!: string;

  @IsString()
  @Length(1, 160)
  title!: string;

  @IsString()
  @Length(1, 2000)
  content!: string;
}


