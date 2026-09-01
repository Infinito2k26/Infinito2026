import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeamMemberDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsString()
  @IsOptional()
  role?: string;

  // Multipart fields arrive as strings — Type(() => Number) converts before
  // @IsInt() runs, same as CreateTeamDto.declaredSize.
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class UpdateTeamMemberDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class CreateGalleryItemDto {
  @IsString()
  @IsOptional()
  caption?: string;
}

export class UpdateGalleryItemDto {
  @IsString()
  @IsOptional()
  caption?: string;
}
