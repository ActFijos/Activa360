import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  Matches,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '../../../../domain/models/asset.model.js';

export class RegisterAssetDto {
  @ApiProperty({
    description: 'Código SABS o identificador QR único del activo patrimonial (ej. ACT-2026-001 o QR-123)',
    example: 'ACT-2026-001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(ACT|QR|SABS)-[a-zA-Z0-9-]+$/, {
    message:
      'El código debe comenzar con "ACT-", "QR-" o "SABS-" seguido de caracteres alfanuméricos y guiones (ej. ACT-2026-001 o SABS-001)',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Descripción detallada, marca, modelo y serie del activo patrimonial',
    example: 'Servidor Dell PowerEdge R740, 64GB RAM, 2TB SSD',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Estado inicial del bien patrimonial según normativa SABS (DISPONIBLE, ACTIVO, Nuevo, Asignado)',
    enum: [AssetStatus.DISPONIBLE, AssetStatus.ACTIVO, AssetStatus.NUEVO, AssetStatus.ASIGNADO],
    example: 'DISPONIBLE',
  })
  @IsIn(
    [
      AssetStatus.DISPONIBLE,
      AssetStatus.ACTIVO,
      AssetStatus.NUEVO,
      AssetStatus.ASIGNADO,
      'DISPONIBLE',
      'ACTIVO',
      'Nuevo',
      'Asignado',
    ],
    {
      message: 'El estado inicial del activo debe ser DISPONIBLE, ACTIVO, Nuevo o Asignado.',
    },
  )
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    description: 'Unidad administrativa, piso o almacén de ubicación física del activo',
    example: 'Dirección de Tecnologías de Información - Rack Central',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Categoría patrimonial del bien (ej. Equipos de Computación, Vehículos, Mobiliario)',
    example: 'Equipos de Computación',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Vida útil estimada en años',
    example: 5,
  })
  @IsInt()
  @Min(1, { message: 'La vida útil debe ser al menos de 1 año' })
  @IsOptional()
  usefulLife?: number;

  @ApiProperty({
    description: 'Origen de incorporación patrimonial (Compra, Donación, Transferencia)',
    example: 'Compra',
  })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({
    description: 'Fecha de adquisición del bien patrimonial en formato ISO 8601',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsDateString(
    {},
    {
      message:
        'La fecha de compra debe tener un formato de fecha válido (ISO 8601)',
    },
  )
  @IsNotEmpty()
  purchaseDate: string;

  @ApiProperty({
    description: 'Fecha de ingreso al almacén o unidad solicitante en formato ISO 8601',
    example: '2026-01-20T00:00:00.000Z',
  })
  @IsDateString(
    {},
    {
      message:
        'La fecha de ingreso debe tener un formato de fecha válido (ISO 8601)',
    },
  )
  @IsNotEmpty()
  entryDate: string;

  @ApiProperty({
    description: 'Valor histórico de adquisición en moneda del sistema ($us o Bs.)',
    example: 3500.5,
  })
  @IsNumber()
  @Min(0.01, {
    message: 'El valor de compra debe ser un número positivo mayor que cero',
  })
  @IsNotEmpty()
  purchaseValue: number;

  @ApiPropertyOptional({
    description: 'Meses de garantía técnica otorgados por el fabricante/proveedor',
    example: 36,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  warrantyMonths?: number;

  @ApiPropertyOptional({
    description: 'Razón social del proveedor adjudicado',
    example: 'Dell Technologies Bolivia S.R.L.',
  })
  @IsString()
  @IsOptional()
  providerName?: string;

  @ApiPropertyOptional({
    description: 'Número de Identificación Tributaria (NIT) del proveedor',
    example: '1029384756',
  })
  @IsString()
  @IsOptional()
  providerNit?: string;

  @ApiPropertyOptional({
    description: 'Teléfono o contacto del proveedor',
    example: '+591 4 4123456',
  })
  @IsString()
  @IsOptional()
  providerPhone?: string;
}
