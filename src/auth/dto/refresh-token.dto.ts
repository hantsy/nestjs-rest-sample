import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'The refresh token obtained at login',
  })
  @IsNotEmpty()
  @IsString()
  readonly refresh_token: string;
}
