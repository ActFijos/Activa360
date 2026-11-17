import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Query,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RegisterAssetUseCase } from '../../../domain/ports/in/register-asset.use-case.js';
import { ChangeAssetStatusUseCase } from '../../../domain/ports/in/change-asset-status.use-case.js';
import { CreateDiagnosticoUseCase } from '../../../domain/ports/in/create-diagnostico.use-case.js';
import { AssetRepositoryPort } from '../../../domain/ports/out/asset-repository.port.js';
import { RegisterAssetDto } from './dto/register-asset.dto.js';
import { SubmitInspectionDto } from './dto/submit-inspection.dto.js';
import { ChangeAssetStatusDto } from './dto/change-asset-status.dto.js';
import { QueryAssetsDto } from './dto/query-assets.dto.js';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto.js';
import { AssetResponseDto } from './dto/asset-response.dto.js';
import { DiagnosticoResponseDto } from './dto/diagnostico-response.dto.js';
import { AssetStatus } from '../../../domain/models/asset.model.js';

@ApiTags('activos')
@Controller('activos')
export class RegisterAssetController {
  constructor(
    @Inject(RegisterAssetUseCase)
    private readonly registerAssetUseCase: RegisterAssetUseCase,
    @Inject(ChangeAssetStatusUseCase)
    private readonly changeAssetStatusUseCase: ChangeAssetStatusUseCase,
    @Inject(CreateDiagnosticoUseCase)
    private readonly createDiagnosticoUseCase: CreateDiagnosticoUseCase,
    @Inject(AssetRepositoryPort)
    private readonly assetRepository: AssetRepositoryPort,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Alta y registro de bien patrimonial con código SABS único',
    description:
      'Registra un nuevo activo fijo patrimonial validando unicidad de código SABS/QR, descripción, categoría, fecha de adquisición, valor histórico y estado inicial (DISPONIBLE o ACTIVO).',
  })
  @ApiResponse({
    status: 201,
    description: 'Activo patrimonial registrado exitosamente en el inventario',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos del activo patrimonial inválidos o incompletos',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: Ya existe un activo registrado con el mismo código patrimonial/QR',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async registerAsset(@Body() dto: RegisterAssetDto) {
    return this.registerAssetUseCase.execute({
      qrCode: dto.qrCode,
      name: dto.name,
      status: dto.status,
      location: dto.location,
      category: dto.category,
      usefulLife: dto.usefulLife,
      origin: dto.origin,
      purchaseDate: new Date(dto.purchaseDate),
      entryDate: new Date(dto.entryDate),
      purchaseValue: dto.purchaseValue,
      warrantyMonths: dto.warrantyMonths,
      providerName: dto.providerName,
      providerNit: dto.providerNit,
      providerPhone: dto.providerPhone,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Consultar y listar bienes patrimoniales con filtros',
    description:
      'Recupera la lista de activos fijos patrimoniales permitiendo filtrar por estado normativo, código SABS o unidad administrativa, incluyendo trazabilidad de cambios de estado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de bienes patrimoniales recuperado exitosamente',
    type: [AssetResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de búsqueda o filtros inválidos',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAllAssets(@Query() query?: QueryAssetsDto) {
    if (query && (query.estado || query.codigo || query.unidad)) {
      return this.assetRepository.findAllWithFilters({
        estado: query.estado,
        codigo: query.codigo,
        unidad: query.unidad,
      });
    }
    return this.assetRepository.findAll();
  }

  @Get('qr/:qrCode')
  @ApiOperation({
    summary: 'Buscar activo por código QR o código SABS',
    description:
      'Obtiene los datos de un activo a partir de su código QR o código patrimonial SABS único.',
  })
  @ApiParam({
    name: 'qrCode',
    description: 'Código QR o código patrimonial único del activo',
    example: 'ACT-2026-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Activo patrimonial encontrado',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activo con el código especificado no encontrado',
  })
  async getAssetByQrCode(@Param('qrCode') qrCode: string) {
    const asset = await this.assetRepository.findByQrCode(qrCode);
    if (!asset) {
      throw new NotFoundException(
        `Activo con código QR ${qrCode} no encontrado.`,
      );
    }
    return asset;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar bien patrimonial por ID con trazabilidad completa de estados',
    description:
      'Recupera el detalle exhaustivo del activo patrimonial por UUID, incluyendo su historial de transiciones de estado SABS e informes de diagnóstico técnico asociados.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del activo patrimonial',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del activo patrimonial con historial de trazabilidad',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Activo patrimonial no encontrado',
  })
  async getAssetById(@Param('id') id: string) {
    const asset = await this.assetRepository.findByIdWithHistory(id);
    if (!asset) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado.`);
    }
    return asset;
  }

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Transición controlada de estados patrimoniales SABS',
    description:
      'Ejecuta una transición de estado controlada por la normativa SABS (ej. DISPONIBLE -> ASIGNADO / EN_MANTENIMIENTO -> EN_DIAGNOSTICO -> APTO_PARA_BAJA). Bloquea transiciones no permitidas y estados terminales (Dado_De_Baja), guardando la trazabilidad histórica.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del activo patrimonial a transicionar',
  })
  @ApiResponse({
    status: 200,
    description: 'Transición de estado ejecutada exitosamente y registrada en la trazabilidad',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de transición inválidos o motivo insuficiente',
  })
  @ApiResponse({
    status: 404,
    description: 'Activo patrimonial no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto normativo SABS: Transición no permitida o activo en estado terminal',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeAssetStatusDto,
  ) {
    return this.changeAssetStatusUseCase.execute({
      assetId: id,
      nuevoEstado: dto.nuevoEstado,
      motivo: dto.motivo,
      responsable: dto.responsable,
    });
  }

  @Post(':id/diagnosticos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir informe de diagnóstico técnico previo a baja patrimonial SABS',
    description:
      'Registra un informe pericial de evaluación técnica con número de informe correlativo, causal SABS (obsolescencia, deterioro irreparable, etc.), dictamen y recomendación. Si dictamina baja, transiciona automáticamente el activo a APTO_PARA_BAJA y deja el diagnóstico en estado VIGENTE para habilitar el workflow de bajas.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del activo a diagnosticar',
  })
  @ApiResponse({
    status: 201,
    description: 'Informe de diagnóstico técnico emitido exitosamente en estado VIGENTE',
    type: DiagnosticoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos del diagnóstico o causal SABS inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Activo patrimonial no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: Número de informe duplicado o activo en estado terminal Dado_De_Baja',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createDiagnostico(
    @Param('id') id: string,
    @Body() dto: CreateDiagnosticoDto,
  ) {
    return this.createDiagnosticoUseCase.execute({
      assetId: id,
      numeroInforme: dto.numeroInforme,
      causalSabs: dto.causalSabs,
      diagnosticoDetalle: dto.diagnosticoDetalle,
      recomendacion: dto.recomendacion,
      dictaminaBaja: dto.dictaminaBaja,
      evidenciaDocumento: dto.evidenciaDocumento,
      costoEstimadoReparacion: dto.costoEstimadoReparacion,
      tecnicoId: dto.tecnicoId,
      tecnicoNombre: dto.tecnicoNombre,
      observaciones: dto.observaciones,
    });
  }

  @Post(':id/inspeccionar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar inspección técnica básica de mantenimiento',
    description:
      'Registra una inspección de mantenimiento básica en el activo para fines preventivos o correctivos.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del activo a inspeccionar',
  })
  @ApiResponse({
    status: 200,
    description: 'Inspección técnica registrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Activo no encontrado',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async inspectAsset(
    @Param('id') id: string,
    @Body() dto: SubmitInspectionDto,
  ) {
    const asset = await this.assetRepository.findById(id);
    if (!asset) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado.`);
    }

    await this.assetRepository.saveMaintenanceReport({
      assetId: id,
      diagnosis: dto.diagnosis,
      estimatedCost: dto.estimatedCost,
      action: dto.action,
    });

    if (dto.action === 'Recomendar_Baja') {
      const isObsolete =
        dto.diagnosis.toLowerCase().includes('obsoleto') ||
        dto.diagnosis.toLowerCase().includes('obsolescencia');
      asset.status = isObsolete ? AssetStatus.OBSOLETO : AssetStatus.DANADO;
      await this.assetRepository.save(asset);
    }

    return {
      message: 'Inspección técnica registrada exitosamente.',
      newStatus: asset.status,
    };
  }
}
