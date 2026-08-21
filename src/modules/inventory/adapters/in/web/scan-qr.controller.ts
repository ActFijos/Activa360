import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ScanQrUseCase } from '../../../domain/ports/in/scan-qr.use-case';
import { ScanQrDto } from './dto/scan-qr.dto';
import { SyncOfflineUseCase } from '../../../domain/ports/in/sync-offline.use-case';
import { SyncOfflineDto } from './dto/sync-offline.dto';

@Controller('activos')
export class ScanQrController {
  constructor(
    private readonly scanQrUseCase: ScanQrUseCase,
    private readonly syncOfflineUseCase: SyncOfflineUseCase,
  ) {}

  @Post('qr')
  @HttpCode(HttpStatus.OK)
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
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async syncOffline(@Body() syncOfflineDto: SyncOfflineDto) {
    return this.syncOfflineUseCase.execute(syncOfflineDto.items);
  }
}
