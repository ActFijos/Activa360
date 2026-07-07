import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class InitiateBajaDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsString()
  @IsNotEmpty()
  jefeId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'La justificación debe tener al menos 10 caracteres' })
  justification: string;

  @IsString()
  @IsNotEmpty()
  evidence: string;
}
