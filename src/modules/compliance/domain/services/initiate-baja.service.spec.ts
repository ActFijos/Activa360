import { Test, TestingModule } from '@nestjs/testing';
import { InitiateBajaService } from './initiate-baja.service';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port';
import { AssetServicePort } from '../ports/out/asset-service.port';
import { InMemoryBajaRepository } from '../../adapters/out/persistence/in-memory-baja.repository';
import { BajaStatus } from '../models/baja.model';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('InitiateBajaService (FSD-UC-003)', () => {
  let service: InitiateBajaService;
  let bajaRepo: InMemoryBajaRepository;
  let fakeAssetService: jest.Mocked<AssetServicePort>;

  beforeEach(async () => {
    fakeAssetService = {
      getAsset: jest.fn(),
      updateAssetStatus: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateBajaService,
        { provide: BajaRepositoryPort, useClass: InMemoryBajaRepository },
        { provide: AssetServicePort, useValue: fakeAssetService },
      ],
    }).compile();

    service = module.get<InitiateBajaService>(InitiateBajaService);
    bajaRepo = module.get<BajaRepositoryPort>(BajaRepositoryPort) as InMemoryBajaRepository;
  });

  it('debería iniciar la baja con éxito para un activo Dañado', async () => {
    fakeAssetService.getAsset.mockResolvedValue({
      id: 'asset-1',
      status: 'Dañado',
      location: 'Oficina A',
    });

    const result = await service.execute(
      'asset-1',
      'jefe-1',
      'El equipo sufrió un cortocircuito irreparable.',
      'http://evidencia.com/foto.jpg',
    );

    expect(result.assetId).toBe('asset-1');
    expect(result.jefeId).toBe('jefe-1');
    expect(result.justification).toBe('El equipo sufrió un cortocircuito irreparable.');
    expect(result.evidence).toBe('http://evidencia.com/foto.jpg');
    expect(result.status).toBe(BajaStatus.INICIADA);

    expect(fakeAssetService.updateAssetStatus).toHaveBeenCalledWith('asset-1', 'En_Proceso_Baja');
    expect(bajaRepo.bajas.length).toBe(1);
  });

  it('debería iniciar la baja con éxito para un activo Obsoleto', async () => {
    fakeAssetService.getAsset.mockResolvedValue({
      id: 'asset-2',
      status: 'Obsoleto',
      location: 'Almacén B',
    });

    const result = await service.execute(
      'asset-2',
      'jefe-1',
      'El equipo tecnológico tiene más de 10 años y no soporta actualizaciones.',
      'http://evidencia.com/foto2.jpg',
    );

    expect(result.assetId).toBe('asset-2');
    expect(result.status).toBe(BajaStatus.INICIADA);
    expect(fakeAssetService.updateAssetStatus).toHaveBeenCalledWith('asset-2', 'En_Proceso_Baja');
  });

  it('debería lanzar NotFoundException si el activo no existe', async () => {
    fakeAssetService.getAsset.mockResolvedValue(null);

    await expect(
      service.execute('asset-non-existent', 'jefe-1', 'Justificacion corta', 'evidence'),
    ).rejects.toThrow(NotFoundException);

    expect(fakeAssetService.updateAssetStatus).not.toHaveBeenCalled();
    expect(bajaRepo.bajas.length).toBe(0);
  });

  it('debería lanzar ConflictException si el activo está en un estado no permitido (ej: Nuevo)', async () => {
    fakeAssetService.getAsset.mockResolvedValue({
      id: 'asset-3',
      status: 'Nuevo',
      location: 'Oficina C',
    });

    await expect(
      service.execute('asset-3', 'jefe-1', 'Justificacion de prueba', 'evidence'),
    ).rejects.toThrow(ConflictException);

    expect(fakeAssetService.updateAssetStatus).not.toHaveBeenCalled();
  });

  it('debería lanzar ConflictException si el activo ya tiene un proceso de baja iniciado', async () => {
    fakeAssetService.getAsset.mockResolvedValue({
      id: 'asset-4',
      status: 'Dañado',
      location: 'Oficina D',
    });

    // Registrar una baja previa para el activo 4
    await service.execute('asset-4', 'jefe-1', 'Primera justificación', 'evidence');

    // Intentar registrar una segunda baja para el mismo activo
    await expect(
      service.execute('asset-4', 'jefe-1', 'Segunda justificación de prueba', 'evidence'),
    ).rejects.toThrow(ConflictException);
  });
});
