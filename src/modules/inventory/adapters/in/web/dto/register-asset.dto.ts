import { IsNotEmpty, IsString, IsInt, IsNumber, Min, IsOptional, Matches, IsDateString, IsIn } from 'class-validator';
import { AssetStatus } from '../../../../domain/models/asset.model.js';

export class RegisterAssetDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(ACT|QR)-[a-zA-Z0-9-]+$/, {
    message: 'El código QR debe comenzar con "ACT-" o "QR-" seguido de caracteres alfanuméricos y guiones (ej. ACT-2026-001 o QR-123)',
  })
  qrCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn([AssetStatus.NUEVO, AssetStatus.ASIGNADO], {
    message: 'El estado inicial del activo debe ser Nuevo o Asignado.',
  })
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsInt()
  @Min(1, { message: 'La vida útil debe ser al menos de 1 año' })
  @IsOptional()
  usefulLife?: number;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsDateString({}, { message: 'La fecha de compra debe tener un formato de fecha válido (ISO 8601)' })
  @IsNotEmpty()
  purchaseDate: string;

  @IsDateString({}, { message: 'La fecha de ingreso debe tener un formato de fecha válido (ISO 8601)' })
  @IsNotEmpty()
  entryDate: string;

  @IsNumber()
  @Min(0.01, { message: 'El valor de compra debe ser un número positivo mayor que cero' })
  @IsNotEmpty()
  purchaseValue: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  warrantyMonths?: number;

  @IsString()
  @IsOptional()
  providerName?: string;

  @IsString()
  @IsOptional()
  providerNit?: string;

  @IsString()
  @IsOptional()
  providerPhone?: string;
}

