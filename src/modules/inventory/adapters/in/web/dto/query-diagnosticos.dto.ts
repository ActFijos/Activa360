import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDiagnosticosDto {
  @ApiPropertyOptional({
    description: 'Filtrar diagnósticos por estado normativo (VIGENTE, UTILIZADO_EN_BAJA, RESTAURADO, ANULADO)',
    example: 'VIGENTE',
  })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por identificador único del activo evaluado (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  @IsOptional()
  activo_id?: string;
}
