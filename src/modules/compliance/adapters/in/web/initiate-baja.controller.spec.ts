import { Test, TestingModule } from '@nestjs/testing';
import { InitiateBajaController } from './initiate-baja.controller';
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case';
import { Baja, BajaStatus } from '../../../domain/models/baja.model';

describe('InitiateBajaController', () => {
  let controller: InitiateBajaController;
  let fakeInitiateBajaUseCase: jest.Mocked<InitiateBajaUseCase>;

  beforeEach(async () => {
    fakeInitiateBajaUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InitiateBajaController],
      providers: [
        {
          provide: InitiateBajaUseCase,
          useValue: fakeInitiateBajaUseCase,
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
});
