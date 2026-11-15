import { ApiProperty } from '@nestjs/swagger';

export class BajasPaginationMetaDto {
  @ApiProperty({ example: 45, description: 'Total de registros que coinciden con los filtros aplicados' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página actual consultada' })
  page: number;

  @ApiProperty({ example: 10, description: 'Límite de registros por página' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Total de páginas calculadas' })
  totalPages: number;
}

export class BajaItemResponseDto {
  @ApiProperty({ example: 'baja-uuid-1', description: 'ID único del trámite de baja' })
  id: string;

  @ApiProperty({ example: 'asset-uuid-1', description: 'ID del activo vinculado' })
  assetId: string;

  @ApiProperty({ example: 'jefe-uuid-1', description: 'ID del jefe o supervisor autorizador' })
  jefeId: string;

  @ApiProperty({ example: 'Equipo obsoleto no actualizable', description: 'Justificación contable de la baja' })
  justification: string;

  @ApiProperty({ example: 'ACTA-2026-001', description: 'Referencia a la evidencia o acta física de soporte' })
  evidence: string;

  @ApiProperty({ example: '2026-05-10T12:00:00.000Z', description: 'Fecha de inicio del trámite' })
  initiatedAt: Date;

  @ApiProperty({ example: 'Iniciada', enum: ['Iniciada', 'APROBADA', 'RECHAZADA'], description: 'Estado actual del trámite' })
  status: string;

  @ApiProperty({ example: null, nullable: true, description: 'Motivo de rechazo registrado si el estado es RECHAZADA' })
  motivoRechazo?: string | null;
}

export class PaginatedBajasResponseDto {
  @ApiProperty({ type: [BajaItemResponseDto], description: 'Lista de trámites de baja en la página actual' })
  data: BajaItemResponseDto[];

  @ApiProperty({ type: BajasPaginationMetaDto, description: 'Metadatos de paginación' })
  meta: BajasPaginationMetaDto;
}
