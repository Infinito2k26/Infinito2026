import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateIf,
  IsInt,
} from 'class-validator';

export enum TaskSource {
  MODERATOR = 'MODERATOR',
  BRAND = 'BRAND',
}

export enum TaskCategory {
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  PHYSICAL = 'PHYSICAL',
  CONTENT = 'CONTENT',
  COMMUNITY = 'COMMUNITY',
}

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;
}

export class UpdateBrandDto {
  @IsEnum(['ACTIVE', 'ARCHIVED'])
  @IsOptional()
  status?: 'ACTIVE' | 'ARCHIVED';

  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(TaskCategory)
  category!: TaskCategory;

  @IsEnum(TaskSource)
  source!: TaskSource;

  @ValidateIf((o: CreateTaskDto) => o.source === TaskSource.BRAND)
  @IsString()
  @IsNotEmpty({ message: 'brandId is required when source is BRAND' })
  brandId?: string;

  @IsInt()
  points!: number;
}

export class UpdateTaskDto {
  @IsEnum(['ACTIVE', 'ARCHIVED'])
  @IsOptional()
  status?: 'ACTIVE' | 'ARCHIVED';
}

export class VerifyTaskDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @IsInt()
  @IsOptional()
  pointsOverride?: number;

  @ValidateIf((o: VerifyTaskDto) => o.status === 'REJECTED')
  @IsString()
  @IsNotEmpty({ message: 'rejectionReason is required when rejecting a task' })
  rejectionReason?: string;
}

export class ReviewApplicationDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @ValidateIf((o: ReviewApplicationDto) => o.status === 'REJECTED')
  @IsString()
  @IsNotEmpty({
    message: 'rejectionReason is required when rejecting an application',
  })
  rejectionReason?: string;
}
