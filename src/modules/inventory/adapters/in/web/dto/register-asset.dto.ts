import { IsNotEmpty, IsString, IsEnum, IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { AssetStatus } from '../../../../domain/models/asset.model.js';

export class RegisterAssetDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AssetStatus, {
    message: 'El estado debe ser Nuevo, Asignado, En_Traspaso, Dañado, Obsoleto, En_Proceso_Baja, o Dado_De_Baja',
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
  @Min(0)
  @IsOptional()
  usefulLife?: number;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  purchaseDate: string;

  @IsString()
  @IsNotEmpty()
  entryDate: string;

  @IsNumber()
  @Min(0)
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
