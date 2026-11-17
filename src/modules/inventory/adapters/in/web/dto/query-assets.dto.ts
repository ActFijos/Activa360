import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAssetsDto {
  @ApiPropertyOptional({
    description: 'Filtrar bienes patrimoniales por estado (ej. DISPONIBLE, ASIGNADO, EN_DIAGNOSTICO, APTO_PARA_BAJA, Dañado, Obsoleto, Dado_De_Baja)',
    example: 'APTO_PARA_BAJA',
  })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por coincidencia en el código QR o código SABS patrimonial',
    example: 'ACT-2026',
  })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por unidad administrativa, departamento o ubicación física',
    example: 'Tecnologías',
  })
  @IsString()
  @IsOptional()
  unidad?: string;
}
