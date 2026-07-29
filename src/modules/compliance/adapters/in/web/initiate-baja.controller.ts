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
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case';
import { InitiateBajaDto } from './dto/initiate-baja.dto';
import { PrismaService } from '../../out/db/prisma.service.js';

@Controller('bajas')
export class InitiateBajaController {
  constructor(
    private readonly initiateBajaUseCase: InitiateBajaUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async getBajas() {
    return this.prisma.baja.findMany({
      orderBy: { initiatedAt: 'desc' }
    });
  }

  @Post(':id/aprobar')
  @HttpCode(HttpStatus.OK)
  async approveBaja(@Param('id') id: string) {
    const baja = await this.prisma.baja.findUnique({
      where: { id }
    });
    if (!baja) {
      throw new NotFoundException(`La baja con ID ${id} no existe`);
    }

    await this.prisma.baja.update({
      where: { id },
      data: { status: 'APROBADA' }
    });

    await this.prisma.asset.update({
      where: { id: baja.assetId },
      data: { status: 'Dado_De_Baja' }
    });

    return { success: true, message: 'Baja aprobada y activo retirado de inventarios' };
  }

  @Post(':id/rechazar')
  @HttpCode(HttpStatus.OK)
  async rejectBaja(@Param('id') id: string) {
    const baja = await this.prisma.baja.findUnique({
      where: { id }
    });
    if (!baja) {
      throw new NotFoundException(`La baja con ID ${id} no existe`);
    }

    await this.prisma.baja.update({
      where: { id },
      data: { status: 'RECHAZADA' }
    });

    const lastInspection = await this.prisma.maintenanceReport.findFirst({
      where: { assetId: baja.assetId },
      orderBy: { inspectedAt: 'desc' }
    });

    let targetStatus = 'Dañado';
    if (lastInspection && lastInspection.diagnosis.toLowerCase().includes('obsole')) {
      targetStatus = 'Obsoleto';
    }

    await this.prisma.asset.update({
      where: { id: baja.assetId },
      data: { status: targetStatus }
    });

    return { success: true, message: 'Baja rechazada y activo restaurado a revisión técnica' };
  }
}
