import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RegisterInventoryScanUseCase } from '../../../domain/ports/in/register-inventory-scan.use-case.js';

class RegisterInventoryScanDto {
  campaignId: string;
  assetId: string;
  userId: string;
}

/**
 * POST /inventory/scan
 *
 * Registra el escaneo QR de un activo dentro de una campaña de inventario.
 * Respuestas:
 *   201 Created  — registro creado correctamente.
 *   409 Conflict — el activo ya fue registrado en esta campaña (duplicado).
 *   404 Not Found — el activo no existe.
 */
@Controller('inventory')
export class InventoryScanController {
  constructor(
    private readonly registerInventoryScan: RegisterInventoryScanUseCase,
  ) {}

  @Post('scan')
  @HttpCode(HttpStatus.CREATED)
  async registerScan(@Body() dto: RegisterInventoryScanDto) {
    const record = await this.registerInventoryScan.execute({
      campaignId: dto.campaignId,
      assetId: dto.assetId,
      userId: dto.userId,
    });
    return {
      message: 'Activo registrado en el inventario correctamente.',
      record,
    };
  }
}
