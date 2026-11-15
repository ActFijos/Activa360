import { Test, TestingModule } from '@nestjs/testing';
import { InitiateBajaController } from './initiate-baja.controller.js';
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case.js';
import { ListBajasUseCase } from '../../../domain/ports/in/list-bajas.use-case.js';
import { RejectBajaUseCase } from '../../../domain/ports/in/reject-baja.use-case.js';
import { Baja, BajaStatus } from '../../../domain/models/baja.model.js';
import { PrismaService } from '../../out/db/prisma.service.js';
import { BajaFilterStatus } from './dto/list-bajas-query.dto.js';

describe('InitiateBajaController', () => {
  let controller: InitiateBajaController;
  let fakeInitiateBajaUseCase: jest.Mocked<InitiateBajaUseCase>;
  let fakeListBajasUseCase: jest.Mocked<ListBajasUseCase>;
  let fakeRejectBajaUseCase: jest.Mocked<RejectBajaUseCase>;

  const mockBaja = new Baja(
    'baja-uuid-1',
    'asset-uuid-1',
    'jefe-uuid-1',
    'Justificación de baja por desuso',
    'http://evidencia.url/foto.jpg',
    new Date(),
    BajaStatus.INICIADA,
  );

  beforeEach(async () => {
    fakeInitiateBajaUseCase = {
      execute: jest.fn(),
    };
    fakeListBajasUseCase = {
      execute: jest.fn(),
    };
    fakeRejectBajaUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InitiateBajaController],
      providers: [
        {
          provide: InitiateBajaUseCase,
          useValue: fakeInitiateBajaUseCase,
        },
        {
          provide: ListBajasUseCase,
          useValue: fakeListBajasUseCase,
        },
        {
          provide: RejectBajaUseCase,
          useValue: fakeRejectBajaUseCase,
        },
        {
          provide: PrismaService,
          useValue: {
            baja: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            asset: {
              update: jest.fn(),
            },
            maintenanceReport: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<InitiateBajaController>(InitiateBajaController);
  });

  it('should call execute on InitiateBajaUseCase and return the initiated baja', async () => {
    fakeInitiateBajaUseCase.execute.mockResolvedValue(mockBaja);

    const dto = {
      assetId: 'asset-uuid-1',
      jefeId: 'jefe-uuid-1',
      justification: 'Justificación de baja por desuso',
      evidence: 'http://evidencia.url/foto.jpg',
    };
    const result = await controller.initiateBaja(dto);

    expect(fakeInitiateBajaUseCase.execute).toHaveBeenCalledWith(
      dto.assetId,
      dto.jefeId,
      dto.justification,
      dto.evidence,
    );
    expect(result).toEqual(mockBaja);
  });

  it('Feature 1 & 2: should call execute on ListBajasUseCase with filters and pagination query', async () => {
    const paginatedResponse = {
      data: [mockBaja],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    fakeListBajasUseCase.execute.mockResolvedValue(paginatedResponse);

    const query = {
      estado: BajaFilterStatus.INICIADA,
      activo: 'asset-uuid-1',
      page: 1,
      limit: 10,
    };
    const result = await controller.getBajas(query);

    expect(fakeListBajasUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toEqual(paginatedResponse);
  });

  it('Feature 3: should call execute on RejectBajaUseCase with id and motivoRechazo', async () => {
    const rejectedBaja = new Baja(
      'baja-uuid-1',
      'asset-uuid-1',
      'jefe-uuid-1',
      'Justificación de baja',
      'evidencia',
      new Date(),
      BajaStatus.RECHAZADA,
      'Rechazado porque puede ser reacondicionado',
    );
    fakeRejectBajaUseCase.execute.mockResolvedValue(rejectedBaja);

    const result = await controller.rejectBaja('baja-uuid-1', {
      motivoRechazo: 'Rechazado porque puede ser reacondicionado',
    });

    expect(fakeRejectBajaUseCase.execute).toHaveBeenCalledWith(
      'baja-uuid-1',
      'Rechazado porque puede ser reacondicionado',
    );
    expect(result).toEqual(rejectedBaja);
  });
});
