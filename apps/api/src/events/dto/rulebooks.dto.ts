import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRulebookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  version?: string;

  // Pasted external link (e.g. Google Drive share URL) — mutually exclusive
  // with an uploaded file, same "exactly one of" pattern as CaTask proof
  // submission (see CaService.submitTask).
  @IsString()
  @IsOptional()
  fileUrl?: string;
}
