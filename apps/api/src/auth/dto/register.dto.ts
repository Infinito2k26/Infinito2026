import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{10,15}$/, {
    message: 'Please enter a valid phone number',
  })
  phone!: string;

  @IsOptional()
  @IsString()
  college?: string;

  @IsBoolean()
  consent!: boolean;
}
