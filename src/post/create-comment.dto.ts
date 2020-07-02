import { IsNotEmpty } from 'class-validator';
export class CreateCommentDto {

  @IsNotEmpty()
  readonly content: string;
}
