import { IsNotEmpty } from "class-validator";

export class UpdatePostDto {

  @IsNotEmpty()
  readonly title: string;

  @IsNotEmpty()
  readonly content: string;
}
