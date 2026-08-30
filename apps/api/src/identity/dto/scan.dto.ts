import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ScanDirection } from '@prisma/client';

export class ScanDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  gate!: string;

  @IsEnum(ScanDirection)
  direction!: ScanDirection;
}
