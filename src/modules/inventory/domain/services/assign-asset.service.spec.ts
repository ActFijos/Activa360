import { Test, TestingModule } from '@nestjs/testing';
import { AssignAssetService } from './assign-asset.service';
import { AssetRepositoryPort } from '../ports/out/asset-repository.port';
import { AssignmentRepositoryPort } from '../ports/out/assignment-repository.port';
import { InMemoryAssetRepository } from '../../adapters/out/persistence/in-memory-asset.repository';
import { Asset, AssetStatus } from '../models/asset.model';
import { Assignment } from '../models/assignment.model';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AssignAssetService', () => {
  let service: AssignAssetService;
  let assetRepo: InMemoryAssetRepository;
  let fakeAssignmentRepo: jest.Mocked<AssignmentRepositoryPort>;

  beforeEach(async () => {
    fakeAssignmentRepo = {
      save: jest.fn().mockImplementation((a: Assignment) => Promise.resolve(a)),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignAssetService,
        { provide: AssetRepositoryPort, useClass: InMemoryAssetRepository },
        { provide: AssignmentRepositoryPort, useValue: fakeAssignmentRepo },
      ],
    }).compile();

    service = module.get<AssignAssetService>(AssignAssetService);
    assetRepo = module.get<AssetRepositoryPort>(
      AssetRepositoryPort,
    ) as InMemoryAssetRepository;
  });

  it('debería asignar un activo correctamente y cambiar su estado a ASIGNADO', async () => {
    const asset = new Asset(
      'asset-200',
      'QR-ASSIGN-01',
      'Impresora Laser HP',
      AssetStatus.NUEVO,
      'Almacén Central',
      new Date(),
    );
    await assetRepo.save(asset);

    const command = {
      assetId: 'asset-200',
      responsible: 'Carlos Mamani',
      date: new Date(),
      destination: 'Departamento Contabilidad',
      observations: 'Asignación inicial',
    };

    const result = await service.execute(command);

    expect(result.assetId).toBe('asset-200');
    expect(result.responsible).toBe('Carlos Mamani');
    expect(result.destination).toBe('Departamento Contabilidad');

    const updatedAsset = await assetRepo.findById('asset-200');
    expect(updatedAsset?.status).toBe(AssetStatus.ASIGNADO);
    expect(updatedAsset?.location).toBe('Departamento Contabilidad');
    expect(fakeAssignmentRepo.save).toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si el activo a asignar no existe', async () => {
    await expect(
      service.execute({
        assetId: 'asset-inexistent',
        responsible: 'Juan',
        date: new Date(),
        destination: 'Destino',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar ConflictException si el activo se encuentra EN_PROCESO_BAJA', async () => {
    const asset = new Asset(
      'asset-201',
      'QR-ASSIGN-02',
      'Laptop Dañada',
      AssetStatus.EN_PROCESO_BAJA,
      'Depósito',
      new Date(),
    );
    await assetRepo.save(asset);

    await expect(
      service.execute({
        assetId: 'asset-201',
        responsible: 'Pedro',
        date: new Date(),
        destination: 'Sistemas',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
