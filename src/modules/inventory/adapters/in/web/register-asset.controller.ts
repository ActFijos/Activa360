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
      throw new NotFoundException(`Activo con código QR ${qrCode} no encontrado.`);
    }
    return asset;
  }
}
