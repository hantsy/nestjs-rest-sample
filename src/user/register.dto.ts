import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe' })
  @IsNotEmpty()
  readonly username!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'P@ssword123', minLength: 8, maxLength: 20 })
  @IsNotEmpty()
  @MinLength(8, { message: ' The min length of password is 8 ' })
  @MaxLength(20, {
    message: " The password can't accept more than 20 characters ",
  })
  readonly password!: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  readonly firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  readonly lastName?: string;
}
