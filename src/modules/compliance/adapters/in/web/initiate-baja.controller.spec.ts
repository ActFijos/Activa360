import { Test, TestingModule } from '@nestjs/testing';
import { InitiateBajaController } from './initiate-baja.controller';
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case';
import { Baja, BajaStatus } from '../../../domain/models/baja.model';
import { PrismaService } from '../../out/db/prisma.service';
import { GenerateActaPdfUseCase } from '../../../domain/ports/in/generate-acta-pdf.use-case';

describe('InitiateBajaController', () => {
  let controller: InitiateBajaController;
  let fakeInitiateBajaUseCase: jest.Mocked<InitiateBajaUseCase>;
  let fakeGenerateActaPdfUseCase: jest.Mocked<GenerateActaPdfUseCase>;

  beforeEach(async () => {
    fakeInitiateBajaUseCase = {
      execute: jest.fn(),
    };
    fakeGenerateActaPdfUseCase = {
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
          provide: GenerateActaPdfUseCase,
          useValue: fakeGenerateActaPdfUseCase,
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
    const mockBaja = new Baja(
      'baja-uuid-1',
      'asset-uuid-1',
      'jefe-uuid-1',
      'Justificación de baja por desuso',
      'http://evidencia.url/foto.jpg',
      new Date(),
      BajaStatus.INICIADA,
    );
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

  it('should call execute on GenerateActaPdfUseCase and stream PDF', async () => {
    const fakeBuffer = Buffer.from('%PDF-1.4 mock content');
    fakeGenerateActaPdfUseCase.execute.mockResolvedValue({
      buffer: fakeBuffer,
      filename: 'Acta-Baja-SABS-TEST.pdf',
    });

    const resMock = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.downloadActaPdf('baja-uuid-1', resMock);

    expect(fakeGenerateActaPdfUseCase.execute).toHaveBeenCalledWith('baja-uuid-1');
    expect(resMock.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Acta-Baja-SABS-TEST.pdf"',
      'Content-Length': fakeBuffer.length,
    });
    expect(resMock.end).toHaveBeenCalledWith(fakeBuffer);
  });
});
