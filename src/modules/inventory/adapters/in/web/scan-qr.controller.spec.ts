import { Test, TestingModule } from '@nestjs/testing';
import { ScanQrController } from './scan-qr.controller';
import { ScanQrUseCase } from '../../../domain/ports/in/scan-qr.use-case';
import { SyncOfflineUseCase } from '../../../domain/ports/in/sync-offline.use-case';
import { Asset, AssetStatus } from '../../../domain/models/asset.model';

describe('ScanQrController', () => {
  let controller: ScanQrController;
  let fakeScanQrUseCase: jest.Mocked<ScanQrUseCase>;
  let fakeSyncOfflineUseCase: jest.Mocked<SyncOfflineUseCase>;

  beforeEach(async () => {
    fakeScanQrUseCase = {
      execute: jest.fn(),
    } as any;

    fakeSyncOfflineUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScanQrController],
      providers: [
        {
          provide: ScanQrUseCase,
          useValue: fakeScanQrUseCase,
        },
        {
          provide: SyncOfflineUseCase,
          useValue: fakeSyncOfflineUseCase,
        },
      ],
    }).compile();

    controller = module.get<ScanQrController>(ScanQrController);
  });

  it('should call execute on ScanQrUseCase and return the asset', async () => {
    const mockAsset = new Asset(
      'uuid-1',
      'QR-123',
      'Asset 1',
      AssetStatus.NUEVO,
      'Office',
      new Date(),
    );
    fakeScanQrUseCase.execute.mockResolvedValue(mockAsset);

    const dto = { qrCode: 'QR-123', latitude: -17.3935, longitude: -66.157 };
    const result = await controller.scanQr(dto);

    expect(fakeScanQrUseCase.execute).toHaveBeenCalledWith(
      dto.qrCode,
      dto.latitude,
      dto.longitude,
    );
    expect(result).toEqual(mockAsset);
  });

  it('should call execute on SyncOfflineUseCase and return sync results', async () => {
    const mockResult = { processedCount: 2, ignoredCount: 0 };
    fakeSyncOfflineUseCase.execute.mockResolvedValue(mockResult);

    const dto = {
      items: [
        {
          qrCode: 'QR-123',
          latitude: -17.3935,
          longitude: -66.157,
          status: AssetStatus.ASIGNADO,
          updatedAt: new Date(),
        },
      ],
    };
    const result = await controller.syncOffline(dto);

    expect(fakeSyncOfflineUseCase.execute).toHaveBeenCalledWith(dto.items);
    expect(result).toEqual(mockResult);
  });
});
