import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ListDiagnosticosUseCase } from '../../../domain/ports/in/list-diagnosticos.use-case.js';
import { GetDiagnosticoByIdUseCase } from '../../../domain/ports/in/get-diagnostico-by-id.use-case.js';
import { QueryDiagnosticosDto } from './dto/query-diagnosticos.dto.js';
import { DiagnosticoResponseDto } from './dto/diagnostico-response.dto.js';

@ApiTags('diagnosticos')
@Controller('diagnosticos')
export class DiagnosticoController {
  constructor(
    @Inject(ListDiagnosticosUseCase)
    private readonly listDiagnosticosUseCase: ListDiagnosticosUseCase,
    @Inject(GetDiagnosticoByIdUseCase)
    private readonly getDiagnosticoByIdUseCase: GetDiagnosticoByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar informes de diagnóstico técnico previo a baja SABS',
    description:
      'Recupera el listado de informes de diagnóstico técnico emitidos, permitiendo filtrar por estado normativo (VIGENTE, UTILIZADO_EN_BAJA, RESTAURADO, ANULADO) y por identificador del activo evaluado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de diagnósticos técnicos recuperado exitosamente',
    type: [DiagnosticoResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta inválidos',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async listDiagnosticos(@Query() query: QueryDiagnosticosDto) {
    return this.listDiagnosticosUseCase.execute({
      estado: query.estado,
      activo_id: query.activo_id,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar informe de diagnóstico técnico por ID',
    description:
      'Obtiene el detalle completo de un informe de diagnóstico técnico emitido, incluyendo su causal SABS, dictamen y estado normativo.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del informe de diagnóstico técnico',
  })
  @ApiResponse({
    status: 200,
    description: 'Informe de diagnóstico técnico encontrado',
    type: DiagnosticoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Informe de diagnóstico técnico no encontrado',
  })
  async getDiagnosticoById(@Param('id') id: string) {
    return this.getDiagnosticoByIdUseCase.execute(id);
  }
}
