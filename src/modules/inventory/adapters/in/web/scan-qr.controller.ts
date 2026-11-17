import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScanQrUseCase } from '../../../domain/ports/in/scan-qr.use-case.js';
import { ScanQrDto } from './dto/scan-qr.dto.js';
import { SyncOfflineUseCase } from '../../../domain/ports/in/sync-offline.use-case.js';
import { SyncOfflineDto } from './dto/sync-offline.dto.js';

@ApiTags('inventario')
@Controller('activos')
export class ScanQrController {
  constructor(
    @Inject(ScanQrUseCase) private readonly scanQrUseCase: ScanQrUseCase,
    @Inject(SyncOfflineUseCase) private readonly syncOfflineUseCase: SyncOfflineUseCase,
  ) {}

  @Post('qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar escaneo de código QR de un activo',
    description: 'Registra la lectura física y ubicación geográfica del código QR de un activo patrimonial.',
  })
  @ApiResponse({ status: 200, description: 'Escaneo registrado exitosamente' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async scanQr(@Body() scanQrDto: ScanQrDto) {
    return this.scanQrUseCase.execute(
      scanQrDto.qrCode,
      scanQrDto.latitude,
      scanQrDto.longitude,
    );
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar lote de escaneos offline',
    description: 'Procesa un lote de actualizaciones de inventario tomadas fuera de línea con resolución de timestamps.',
  })
  @ApiResponse({ status: 200, description: 'Lote sincronizado exitosamente' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async syncOffline(@Body() syncOfflineDto: SyncOfflineDto) {
    return this.syncOfflineUseCase.execute(syncOfflineDto.items);
  }
}
