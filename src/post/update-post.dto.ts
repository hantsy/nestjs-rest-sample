import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({ example: 'Updated Post Title' })
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({ example: 'Updated content.' })
  @IsNotEmpty()
  readonly content: string;
}
