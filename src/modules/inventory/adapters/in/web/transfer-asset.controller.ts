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
  NotFoundException
} from '@nestjs/common';
import { TransferAssetUseCase } from '../../../domain/ports/in/transfer-asset.use-case.js';
import { TransferRepositoryPort } from '../../../domain/ports/out/transfer-repository.port.js';
import { TransferAssetDto } from './dto/transfer-asset.dto.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';
import { randomUUID } from 'crypto';

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
  async getTransfers() {
    return this.transferRepository.findAll();
  }

  @Post('transferencias/:id/aprobar')
  @HttpCode(HttpStatus.OK)
  async approveTransfer(@Param('id') id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id }
    });
    if (!transfer) {
      throw new NotFoundException(`La transferencia con ID ${id} no existe`);
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: transfer.assetId }
    });
    if (!asset) {
      throw new NotFoundException(`El activo con ID ${transfer.assetId} asociado a la transferencia no existe`);
    }

    await this.prisma.transfer.update({
      where: { id },
      data: { status: 'Aprobada' }
    });

    await this.prisma.asset.update({
      where: { id: transfer.assetId },
      data: {
        location: transfer.toUnit,
        status: 'Asignado'
      }
    });

    await this.prisma.assignment.create({
      data: {
        id: randomUUID(),
        assetId: transfer.assetId,
        responsible: transfer.toResponsible,
        date: new Date(),
        destination: transfer.toUnit,
        observations: `Transferencia desde ${transfer.fromUnit} (${transfer.fromResponsible}). Aprobada formalmente.`
      }
    });

    return { success: true, message: 'Transferencia aprobada exitosamente' };
  }

  @Post('transferencias/:id/rechazar')
  @HttpCode(HttpStatus.OK)
  async rejectTransfer(@Param('id') id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id }
    });
    if (!transfer) {
      throw new NotFoundException(`La transferencia con ID ${id} no existe`);
    }

    await this.prisma.transfer.update({
      where: { id },
      data: { status: 'Rechazada' }
    });

    return { success: true, message: 'Transferencia rechazada exitosamente' };
  }
}
