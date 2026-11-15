import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export enum BajaFilterStatus {
  INICIADA = 'INICIADA',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

export class ListBajasQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado del trámite de baja',
    enum: BajaFilterStatus,
    example: BajaFilterStatus.INICIADA,
  })
  @IsOptional()
  @IsEnum(BajaFilterStatus, {
    message: 'El estado debe ser INICIADA, APROBADA o RECHAZADA',
  })
  estado?: BajaFilterStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID, código QR o nombre del activo (búsqueda insensible a mayúsculas)',
    example: 'ACT-UMSS-2026-0001',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda de activo debe ser una cadena de texto' })
  activo?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial del rango de registro de la baja (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'fechaDesde debe ser una fecha válida en formato ISO 8601' })
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango de registro de la baja (ISO 8601)',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'fechaHasta debe ser una fecha válida en formato ISO 8601' })
  fechaHasta?: string;

  @ApiPropertyOptional({
    description: 'Número de página para paginación (comenzando en 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de registros por página',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo permitido es 100' })
  limit: number = 10;
}
