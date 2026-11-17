import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiagnosticoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'INF-TEC-2026-0042' })
  numeroInforme: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  assetId: string;

  @ApiProperty({ example: 'OBSOLESCENCIA' })
  causalSabs: string;

  @ApiProperty({ example: 'Servidor con componentes descontinuados sin repuestos disponibles.' })
  diagnosticoDetalle: string;

  @ApiProperty({ example: 'RECOMENDAR_BAJA' })
  recomendacion: string;

  @ApiProperty({ example: true })
  dictaminaBaja: boolean;

  @ApiProperty({ example: 'VIGENTE' })
  estado: string;

  @ApiProperty({ example: '2026-11-16T20:00:00.000Z' })
  fechaEmision: Date;

  @ApiPropertyOptional({ example: 'TEC-USR-882' })
  tecnicoId?: string;

  @ApiPropertyOptional({ example: 'Ing. Carlos Meneses' })
  tecnicoNombre?: string;

  @ApiPropertyOptional({ example: 'https://docs.activa360.gob.bo/informes/INF-0042.pdf' })
  evidenciaDocumento?: string;

  @ApiPropertyOptional({ example: 0 })
  costoEstimadoReparacion?: number;

  @ApiPropertyOptional({ example: 'Apto para iniciar baja patrimonial SABS' })
  observaciones?: string;
}
