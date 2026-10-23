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
import { TransferAssetUseCase } from '../../../domain/ports/in/transfer-asset.use-case.js';
import { TransferRepositoryPort } from '../../../domain/ports/out/transfer-repository.port.js';
import { TransferAssetDto } from './dto/transfer-asset.dto.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';
import { randomUUID } from 'crypto';

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
      'Caso de uso FSD: UC-TRANS-001.',
  })
  @ApiBody({ type: TransferAssetDto })
  @ApiResponse({
    status: 200,
    description: 'Transferencia creada en estado Pendiente.',
    schema: { example: { id: 'uuid', assetId: 'uuid', status: 'Pendiente', toUnit: 'Unidad B' } },
  })
  @ApiResponse({ status: 404, description: 'Activo no encontrado.' })
  @ApiResponse({ status: 409, description: 'El activo está dado de baja o en proceso de baja.' })
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
  @ApiOperation({ summary: 'Listar todas las transferencias registradas' })
  @ApiResponse({ status: 200, description: 'Lista de transferencias.' })
  async getTransfers() {
    return this.transferRepository.findAll();
  }

  @Post('transferencias/:id/aprobar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar una transferencia pendiente y actualizar estado del activo' })
  @ApiParam({ name: 'id', description: 'ID de la transferencia a aprobar' })
  @ApiResponse({ status: 200, description: 'Transferencia aprobada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Transferencia o activo no encontrado.' })
  async approveTransfer(@Param('id') id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
    });
    if (!transfer) {
      throw new NotFoundException(`La transferencia con ID ${id} no existe`);
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: transfer.assetId },
    });
    if (!asset) {
      throw new NotFoundException(
        `El activo con ID ${transfer.assetId} asociado a la transferencia no existe`,
      );
    }

    await this.prisma.transfer.update({
      where: { id },
      data: { status: 'Aprobada' },
    });

    await this.prisma.asset.update({
      where: { id: transfer.assetId },
      data: {
        location: transfer.toUnit,
        status: 'Asignado',
      },
    });

    await this.prisma.assignment.create({
      data: {
        id: randomUUID(),
        assetId: transfer.assetId,
        responsible: transfer.toResponsible,
        date: new Date(),
        destination: transfer.toUnit,
        observations: `Transferencia desde ${transfer.fromUnit} (${transfer.fromResponsible}). Aprobada formalmente.`,
      },
    });

    return { success: true, message: 'Transferencia aprobada exitosamente' };
  }

  @Post('transferencias/:id/rechazar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una transferencia pendiente' })
  @ApiParam({ name: 'id', description: 'ID de la transferencia a rechazar' })
  @ApiResponse({ status: 200, description: 'Transferencia rechazada exitosamente.' })
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

    return { success: true, message: 'Transferencia rechazada exitosamente' };
  }
}
