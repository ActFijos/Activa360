import { Test, TestingModule } from '@nestjs/testing';
import { TransferAssetController } from './transfer-asset.controller';
import { TransferAssetUseCase } from '../../../domain/ports/in/transfer-asset.use-case';
import { TransferRepositoryPort } from '../../../domain/ports/out/transfer-repository.port';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service';

describe('TransferAssetController', () => {
  let controller: TransferAssetController;
  let useCase: jest.Mocked<TransferAssetUseCase>;
  let repository: jest.Mocked<TransferRepositoryPort>;

  beforeEach(async () => {
    useCase = {
      execute: jest.fn(),
      approve: jest.fn(),
      getActa: jest.fn(),
    } as any;

    repository = {
      save: jest.fn(),
      findAll: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferAssetController],
      providers: [
        { provide: TransferAssetUseCase, useValue: useCase },
        { provide: TransferRepositoryPort, useValue: repository },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TransferAssetController>(TransferAssetController);
  });

  it('debería delegar approveTransfer a useCase.approve', async () => {
    const mockResult = {
      success: true,
      message: 'Transferencia aprobada exitosamente y Acta Bilateral generada.',
      transfer: { id: 'trans-1', status: 'Aprobada' } as any,
      acta: {
        codigo: 'ACTA-TRANS-2026-0001',
        hashIntegridad: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      } as any,
    };
    useCase.approve.mockResolvedValue(mockResult);

    const result = await controller.approveTransfer('trans-1');

    expect(useCase.approve).toHaveBeenCalledWith('trans-1');
    expect(result).toEqual(mockResult);
  });

  it('debería delegar getTransferActa a useCase.getActa', async () => {
    const mockActa = {
      codigo: 'ACTA-TRANS-2026-0001',
      hashIntegridad: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      activoSnapshot: { qrCode: 'QR-123' },
    } as any;
    useCase.getActa.mockResolvedValue(mockActa);

    const result = await controller.getTransferActa('trans-1');

    expect(useCase.getActa).toHaveBeenCalledWith('trans-1');
    expect(result).toEqual(mockActa);
  });
});
