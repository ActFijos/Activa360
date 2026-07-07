import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UsePipes, 
  ValidationPipe 
} from '@nestjs/common';
import { TransferAssetUseCase } from '../../../domain/ports/in/transfer-asset.use-case.js';
import { TransferRepositoryPort } from '../../../domain/ports/out/transfer-repository.port.js';
import { TransferAssetDto } from './dto/transfer-asset.dto.js';

@Controller('activos')
export class TransferAssetController {
  constructor(
    private readonly transferAssetUseCase: TransferAssetUseCase,
    private readonly transferRepository: TransferRepositoryPort,
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
}
