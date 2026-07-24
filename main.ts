import { IsUrl, IsOptional, IsString, MinLength, MaxLength, IsInt, Min } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'Please provide a valid URL including https://' })
  longUrl: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Alias must be at least 3 characters' })
  @MaxLength(30, { message: 'Alias must be under 30 characters' })
  customAlias?: string;

  // TTL in seconds: 86400 = 1 day, 604800 = 7 days, 2592000 = 30 days
  // null = never expires
  @IsOptional()
  @IsInt()
  @Min(60)
  ttlSeconds?: number;
}
