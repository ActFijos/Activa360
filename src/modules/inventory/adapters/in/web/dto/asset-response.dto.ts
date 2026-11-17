import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetStatusHistoryItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  assetId: string;

  @ApiProperty({ example: 'DISPONIBLE' })
  previousStatus: string;

  @ApiProperty({ example: 'EN_DIAGNOSTICO' })
  newStatus: string;

  @ApiPropertyOptional({ example: 'Falla recurrente en fuente de poder' })
  reason?: string;

  @ApiPropertyOptional({ example: 'Lic. Josefina Rojas' })
  changedBy?: string;

  @ApiProperty({ example: '2026-11-16T20:00:00.000Z' })
  changedAt: Date;
}

export class AssetResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'ACT-2026-001' })
  qrCode: string;

  @ApiProperty({ example: 'Servidor Dell PowerEdge R740' })
  name: string;

  @ApiProperty({ example: 'DISPONIBLE' })
  status: string;

  @ApiProperty({ example: 'Data Center Central' })
  location: string;

  @ApiProperty({ example: 'Equipos de Computación' })
  category: string;

  @ApiProperty({ example: 'Compra' })
  origin: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z' })
  purchaseDate: Date;

  @ApiProperty({ example: '2026-01-20T00:00:00.000Z' })
  entryDate: Date;

  @ApiProperty({ example: 3500.5 })
  purchaseValue: number;

  @ApiPropertyOptional({ example: 5 })
  usefulLife?: number;

  @ApiPropertyOptional({ example: 36 })
  warrantyMonths?: number;

  @ApiPropertyOptional({ example: 'Dell Technologies' })
  providerName?: string;

  @ApiPropertyOptional({ example: '1029384756' })
  providerNit?: string;

  @ApiPropertyOptional({ example: '+591 4 4123456' })
  providerPhone?: string;

  @ApiProperty({ example: '2026-11-16T20:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [AssetStatusHistoryItemDto] })
  statusHistory?: AssetStatusHistoryItemDto[];
}
