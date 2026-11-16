import { IsObject, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class WebAuthnResponseDto {
  @IsObject()
  response!: Record<string, unknown>;
}

export class RecoveryDto {
  @IsString()
  @MinLength(8)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9\s-]+$/, { message: 'code contains invalid characters' })
  code!: string;
}
