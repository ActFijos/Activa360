import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case.js';
import { ListBajasUseCase } from '../../../domain/ports/in/list-bajas.use-case.js';
import { RejectBajaUseCase } from '../../../domain/ports/in/reject-baja.use-case.js';
import { InitiateBajaDto } from './dto/initiate-baja.dto.js';
import { ListBajasQueryDto } from './dto/list-bajas-query.dto.js';
import { RejectBajaDto } from './dto/reject-baja.dto.js';
import {
  PaginatedBajasResponseDto,
  BajaItemResponseDto,
} from './dto/paginated-bajas-response.dto.js';
import { PrismaService } from '../../out/db/prisma.service.js';

@ApiTags('compliance')
@Controller('bajas')
export class InitiateBajaController {
  constructor(
    @Inject(InitiateBajaUseCase)
    private readonly initiateBajaUseCase: InitiateBajaUseCase,
    @Inject(ListBajasUseCase)
    private readonly listBajasUseCase: ListBajasUseCase,
    @Inject(RejectBajaUseCase)
    private readonly rejectBajaUseCase: RejectBajaUseCase,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar un nuevo trámite de baja SABS para un activo dañado u obsoleto' })
  @ApiResponse({ status: 201, description: 'Trámite de baja iniciado exitosamente', type: BajaItemResponseDto })
  @ApiResponse({ status: 400, description: 'Datos del trámite inválidos' })
  @ApiResponse({ status: 404, description: 'El activo no existe en el inventario' })
  @ApiResponse({ status: 409, description: 'El activo no se encuentra en estado Dañado/Obsoleto o ya tiene baja iniciada' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async initiateBaja(@Body() dto: InitiateBajaDto) {
    return this.initiateBajaUseCase.execute(
      dto.assetId,
      dto.jefeId,
      dto.justification,
      dto.evidence,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar trámites de bajas con filtros por estado, activo y rango de fechas, más paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de bajas con metadatos total, page, limit y totalPages',
    type: PaginatedBajasResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Parámetros de consulta o fechas inválidas' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getBajas(@Query() query: ListBajasQueryDto) {
    return this.listBajasUseCase.execute(query);
  }

  @Post(':id/aprobar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar trámite de baja y retirar el activo de los inventarios' })
  @ApiParam({ name: 'id', description: 'ID único del trámite de baja' })
  @ApiResponse({ status: 200, description: 'Baja aprobada exitosamente y activo retirado' })
  @ApiResponse({ status: 404, description: 'Trámite de baja no encontrado' })
  async approveBaja(@Param('id') id: string) {
    const baja = await this.prisma.baja.findUnique({
      where: { id },
    });
    if (!baja) {
      throw new NotFoundException(`La baja con ID ${id} no existe`);
    }

    await this.prisma.baja.update({
      where: { id },
      data: { status: 'APROBADA' },
    });

    await this.prisma.asset.update({
      where: { id: baja.assetId },
      data: { status: 'Dado_De_Baja' },
    });

    return {
      success: true,
      message: 'Baja aprobada y activo retirado de inventarios',
    };
  }

  @Post(':id/rechazar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar trámite de baja registrando el motivo obligatorio de rechazo' })
  @ApiParam({ name: 'id', description: 'ID único del trámite de baja a rechazar' })
  @ApiResponse({ status: 200, description: 'Baja rechazada exitosamente con motivo registrado', type: BajaItemResponseDto })
  @ApiResponse({ status: 400, description: 'Motivo de rechazo inválido o la baja no se encuentra en estado INICIADA' })
  @ApiResponse({ status: 404, description: 'Trámite de baja no encontrado' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async rejectBaja(
    @Param('id') id: string,
    @Body() dto: RejectBajaDto,
  ) {
    return this.rejectBajaUseCase.execute(id, dto.motivoRechazo);
  }
}
