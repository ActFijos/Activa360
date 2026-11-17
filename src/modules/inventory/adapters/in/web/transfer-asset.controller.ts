import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { TransferAssetUseCase } from '../../../domain/ports/in/transfer-asset.use-case';
import { TransferRepositoryPort } from '../../../domain/ports/out/transfer-repository.port';
import { TransferAssetDto } from './dto/transfer-asset.dto';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service';

@ApiTags('activos')
@Controller('activos')
export class TransferAssetController {
  constructor(
    private readonly transferAssetUseCase: TransferAssetUseCase,
    private readonly transferRepository: TransferRepositoryPort,
    private readonly prisma: PrismaService,
  ) {}

  @Post('transferir')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({
    summary: 'Solicitar transferencia de activo entre unidades',
    description:
      'Inicia una transferencia de activo con bloqueo pesimista (SELECT FOR UPDATE) ' +
      'dentro de una transacción Prisma. Garantiza que dos solicitudes concurrentes ' +
      'para el mismo activo no generen transferencias duplicadas. ' +
      'Caso de uso FSD: UC-TRANS-001 / FSD-UC-005.',
  })
  @ApiBody({ type: TransferAssetDto })
  @ApiResponse({
    status: 200,
    description: 'Transferencia creada en estado Pendiente.',
    schema: {
      example: {
        id: 'uuid',
        assetId: 'uuid',
        status: 'Pendiente',
        toUnit: 'Unidad B',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Activo no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'El activo está dado de baja o en proceso de baja.',
  })
  async transferAsset(@Body() dto: TransferAssetDto) {
    return this.transferAssetUseCase.execute({
      assetId: dto.assetId,
      toUnit: dto.toUnit,
      toResponsible: dto.toResponsible,
      date: new Date(dto.date),
      reason: dto.reason,
    });
  }

  @Get('transferencias')
  @ApiOperation({
    summary: 'Listar todas las transferencias registradas',
    description:
      'Retorna el historial completo de transferencias incluyendo estado, código de acta bilateral y sello de integridad criptográfico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferencias registradas.',
  })
  async getTransfers() {
    return this.transferRepository.findAll();
  }

  @Post('transferencias/:id/aprobar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar transferencia y generar Acta Bilateral SABS',
    description:
      'Ejecuta la transacción con bloqueo pesimista SELECT FOR UPDATE sobre el activo, ' +
      'libera de responsabilidad al custodio origen, reasigna el activo al custodio destino, ' +
      'genera correlativo oficial de Acta Bilateral SABS, calcula hash criptográfico SHA-256 ' +
      'y registra el span en OpenTelemetry (Grafana Tempo). FSD-UC-005.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único de la transferencia a aprobar',
  })
  @ApiResponse({
    status: 200,
    description:
      'Transferencia aprobada exitosamente y Acta Bilateral generada.',
    schema: {
      example: {
        success: true,
        message:
          'Transferencia aprobada exitosamente y Acta Bilateral generada.',
        transfer: {
          id: 'uuid',
          status: 'Aprobada',
          actaCodigo: 'ACTA-TRANS-2026-0001',
          actaGenerada: true,
          actaHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        acta: {
          codigo: 'ACTA-TRANS-2026-0001',
          fechaEmision: '2026-11-17T00:00:00.000Z',
          hashIntegridad: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transferencia o activo no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'La transferencia ya fue aprobada previamente.',
  })
  async approveTransfer(@Param('id') id: string) {
    return this.transferAssetUseCase.approve(id);
  }

  @Get('transferencias/:id/acta')
  @ApiOperation({
    summary: 'Consultar Acta Bilateral de Transferencia SABS (D.S. 0181)',
    description:
      'Retorna el documento estructurado oficial del Acta de Transferencia Bilateral, ' +
      'incluyendo snapshots de custodios (origen y destino), datos técnicos del activo, ' +
      'sello digital SHA-256 de integridad y datos normativos para su descarga o impresión.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la transferencia para obtener su acta bilateral',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle estructurado del Acta Bilateral SABS.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Acta bilateral no encontrada o la transferencia no ha sido aprobada aún.',
  })
  async getTransferActa(@Param('id') id: string) {
    return this.transferAssetUseCase.getActa(id);
  }

  @Post('transferencias/:id/rechazar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una transferencia pendiente' })
  @ApiParam({ name: 'id', description: 'ID de la transferencia a rechazar' })
  @ApiResponse({
    status: 200,
    description: 'Transferencia rechazada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada.' })
  async rejectTransfer(@Param('id') id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
    });
    if (!transfer) {
      throw new NotFoundException(`La transferencia con ID ${id} no existe`);
    }

    await this.prisma.transfer.update({
      where: { id },
      data: { status: 'Rechazada' },
    });

    // Restaurar estado del activo a Asignado/Operativo si estaba en transferencia
    await this.prisma.asset.update({
      where: { id: transfer.assetId },
      data: { status: 'Asignado' },
    });

    return { success: true, message: 'Transferencia rechazada exitosamente' };
  }
}
