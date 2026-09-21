import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePhoneDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
