import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{10,15}$/, {
    message: 'Please enter a valid phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  college?: string;
}
