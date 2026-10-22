import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { RegisterAssetUseCase } from '../../../domain/ports/in/register-asset.use-case.js';
import { AssetRepositoryPort } from '../../../domain/ports/out/asset-repository.port.js';
import { RegisterAssetDto } from './dto/register-asset.dto.js';
import { SubmitInspectionDto } from './dto/submit-inspection.dto.js';
import { AssetStatus } from '../../../domain/models/asset.model.js';

@Controller('activos')
export class RegisterAssetController {
  constructor(
    private readonly registerAssetUseCase: RegisterAssetUseCase,
    private readonly assetRepository: AssetRepositoryPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async getAllAssets() {
    return this.assetRepository.findAll();
  }

  @Get('qr/:qrCode')
  async getAssetByQrCode(@Param('qrCode') qrCode: string) {
    const asset = await this.assetRepository.findByQrCode(qrCode);
    if (!asset) {
      throw new NotFoundException(
        `Activo con código QR ${qrCode} no encontrado.`,
      );
    }
    return asset;
  }

  @Post(':id/inspeccionar')
  @HttpCode(HttpStatus.OK)
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
