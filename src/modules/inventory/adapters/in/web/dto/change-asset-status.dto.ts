import { IsNotEmpty, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '../../../../domain/models/asset.model.js';

export class ChangeAssetStatusDto {
  @ApiProperty({
    description:
      'Nuevo estado patrimonial normativo a asignar (DISPONIBLE, ASIGNADO, EN_MANTENIMIENTO, EN_DIAGNOSTICO, APTO_PARA_BAJA, Dañado, Obsoleto, En_Proceso_Baja, Dado_De_Baja)',
    example: 'EN_DIAGNOSTICO',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nuevo estado es obligatorio.' })
  @IsIn(
    [
      AssetStatus.DISPONIBLE,
      AssetStatus.ACTIVO,
      AssetStatus.ASIGNADO,
      AssetStatus.EN_TRASPASO,
      AssetStatus.EN_MANTENIMIENTO,
      AssetStatus.EN_DIAGNOSTICO,
      AssetStatus.DANADO,
      AssetStatus.OBSOLETO,
      AssetStatus.APTO_PARA_BAJA,
      AssetStatus.EN_PROCESO_BAJA,
      AssetStatus.DADO_DE_BAJA,
      'DISPONIBLE',
      'ACTIVO',
      'Asignado',
      'En_Traspaso',
      'EN_MANTENIMIENTO',
      'EN_DIAGNOSTICO',
      'Dañado',
      'Obsoleto',
      'APTO_PARA_BAJA',
      'En_Proceso_Baja',
      'Dado_De_Baja',
    ],
    {
      message: 'Estado patrimonial no reconocido por la normativa SABS.',
    },
  )
  nuevoEstado: string;

  @ApiProperty({
    description: 'Motivo o justificación técnica y normativa del cambio de estado (mínimo 5 caracteres)',
    example: 'Envío de activo a evaluación técnica especializada por falla en placa madre',
  })
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio.' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres.' })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Nombre o identificador del usuario responsable de ordenar la transición',
    example: 'Lic. Josefina Rojas - Responsable de Activos Fijos',
  })
  @IsString()
  @IsOptional()
  responsable?: string;
}
