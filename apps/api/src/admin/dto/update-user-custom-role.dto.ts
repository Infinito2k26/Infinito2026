import { IsOptional, IsUUID } from 'class-validator';

export class UpdateUserCustomRoleDto {
  @IsOptional()
  @IsUUID()
  customRoleId!: string | null;
}
