import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CausalSabs,
  RecomendacionTecnica,
} from '../../../../domain/models/diagnostico-tecnico.model.js';

export class CreateDiagnosticoDto {
  @ApiProperty({
    description: 'Número correlativo único del informe de diagnóstico técnico patrimonial',
    example: 'INF-TEC-2026-0042',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de informe es obligatorio.' })
  @MinLength(3, { message: 'El número de informe debe tener al menos 3 caracteres.' })
  numeroInforme: string;

  @ApiProperty({
    description:
      'Causal normativa SABS que fundamenta la evaluación (OBSOLESCENCIA, DETERIORO_IRREPARABLE, SINIESTRO, INCOMPATIBILIDAD_TECNICA, HURTO_O_ROBO)',
    enum: CausalSabs,
    example: CausalSabs.OBSOLESCENCIA,
  })
  @IsString()
  @IsNotEmpty({ message: 'La causal SABS es obligatoria.' })
  @IsIn(
    [
      CausalSabs.OBSOLESCENCIA,
      CausalSabs.DETERIORO_IRREPARABLE,
      CausalSabs.SINIESTRO,
      CausalSabs.INCOMPATIBILIDAD_TECNICA,
      CausalSabs.HURTO_O_ROBO,
      'OBSOLESCENCIA',
      'DETERIORO_IRREPARABLE',
      'SINIESTRO',
      'INCOMPATIBILIDAD_TECNICA',
      'HURTO_O_ROBO',
    ],
    {
      message: 'Causal SABS no permitida por normativa vigente.',
    },
  )
  causalSabs: string;

  @ApiProperty({
    description: 'Detalle técnico, hallazgos de peritaje y descripción del estado físico/lógico del bien',
    example: 'El servidor presenta fallo irrecuperable en controladora RAID y procesadores descontinuados sin soporte.',
  })
  @IsString()
  @IsNotEmpty({ message: 'El detalle del diagnóstico técnico es obligatorio.' })
  @MinLength(5, { message: 'El detalle del diagnóstico debe contener al menos 5 caracteres.' })
  diagnosticoDetalle: string;

  @ApiProperty({
    description: 'Recomendación del informe pericial (RECOMENDAR_BAJA, REPARAR, REASIGNAR)',
    enum: RecomendacionTecnica,
    example: RecomendacionTecnica.RECOMENDAR_BAJA,
  })
  @IsString()
  @IsNotEmpty({ message: 'La recomendación técnica es obligatoria.' })
  @IsIn(
    [
      RecomendacionTecnica.RECOMENDAR_BAJA,
      RecomendacionTecnica.REPARAR,
      RecomendacionTecnica.REASIGNAR,
      'RECOMENDAR_BAJA',
      'REPARAR',
      'REASIGNAR',
    ],
    {
      message: 'Recomendación no permitida.',
    },
  )
  recomendacion: string;

  @ApiProperty({
    description:
      'Indica si el informe dictamina formalmente la baja patrimonial del bien. Si es true, transiciona automáticamente el activo a APTO_PARA_BAJA.',
    example: true,
  })
  @IsBoolean({ message: 'dictaminaBaja debe ser un valor booleano.' })
  dictaminaBaja: boolean;

  @ApiPropertyOptional({
    description: 'URL, enlace o nombre de archivo de la evidencia documental o peritaje adjunto',
    example: 'https://docs.activa360.gob.bo/informes/INF-TEC-2026-0042.pdf',
  })
  @IsString()
  @IsOptional()
  evidenciaDocumento?: string;

  @ApiPropertyOptional({
    description: 'Costo estimado de reparación en moneda local (si fuera técnica o económicamente viable)',
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  costoEstimadoReparacion?: number;

  @ApiPropertyOptional({
    description: 'Identificador del técnico o perito responsable',
    example: 'TEC-USR-882',
  })
  @IsString()
  @IsOptional()
  tecnicoId?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo y cargo del perito o profesional que suscribe el informe',
    example: 'Ing. Carlos Meneses - Especialista en Infraestructura',
  })
  @IsString()
  @IsOptional()
  tecnicoNombre?: string;

  @ApiPropertyOptional({
    description: 'Observaciones normativas o administrativas adicionales',
    example: 'Se sugiere proceder de forma inmediata a la solicitud de baja patrimonial SABS.',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
