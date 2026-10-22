import { Test, TestingModule } from '@nestjs/testing';
import { InitiateBajaService } from './domain/services/initiate-baja.service';
import { BajaRepositoryPort } from './domain/ports/out/baja-repository.port';
import { AssetServicePort } from './domain/ports/out/asset-service.port';
import { InMemoryBajaRepository } from './adapters/out/persistence/in-memory-baja.repository';
import { BajaStatus } from './domain/models/baja.model';
import { ConflictException } from '@nestjs/common';

describe('Flujo de Integración 2: Tramitación de Baja Normativa SABS (Compliance)', () => {
  let bajaService: InitiateBajaService;
  let bajaRepo: InMemoryBajaRepository;
  let simulatedAssetDatabase: Map<string, { id: string; status: string; location: string }>;

  beforeEach(async () => {
    simulatedAssetDatabase = new Map();
    simulatedAssetDatabase.set('asset-sabs-99', {
      id: 'asset-sabs-99',
      status: 'Dañado',
      location: 'Laboratorio Central',
    });

    const fakeAssetService: AssetServicePort = {
      getAsset: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(simulatedAssetDatabase.get(id) || null);
      }),
      updateAssetStatus: jest.fn().mockImplementation((id: string, newStatus: string) => {
        const asset = simulatedAssetDatabase.get(id);
        if (asset) {
          asset.status = newStatus;
        }
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateBajaService,
        { provide: BajaRepositoryPort, useClass: InMemoryBajaRepository },
        { provide: AssetServicePort, useValue: fakeAssetService },
      ],
    }).compile();

    bajaService = module.get<InitiateBajaService>(InitiateBajaService);
    bajaRepo = module.get<BajaRepositoryPort>(
      BajaRepositoryPort,
    ) as InMemoryBajaRepository;
  });

  it('debería ejecutar el flujo completo SABS: Solicitud de Baja -> Cambio de Estado del Activo -> Bloqueo de solicitudes duplicadas', async () => {
    // 1. DADO: Un activo previamente registrado en estado 'Dañado'
    const initialAsset = simulatedAssetDatabase.get('asset-sabs-99');
    expect(initialAsset?.status).toBe('Dañado');

    // 2. CUANDO (Paso 1): Se inicia el trámite normativo de baja SABS
    const resultBaja = await bajaService.execute(
      'asset-sabs-99',
      'jefe-unidad-1',
      'Fallo catastrófico de tarjeta madre por descarga eléctrica',
      'http://s3.activa360.internal/evidencias/foto-dano.jpg',
    );

    // ENTONCES (Verificación Paso 1): La baja es creada con estado INICIADA
    expect(resultBaja.id).toBeDefined();
    expect(resultBaja.assetId).toBe('asset-sabs-99');
    expect(resultBaja.status).toBe(BajaStatus.INICIADA);
    expect(resultBaja.justification).toContain('Fallo catastrófico');

    // Verificación de persistencia intermedia: El activo cambió de estado a En_Proceso_Baja
    const updatedAsset = simulatedAssetDatabase.get('asset-sabs-99');
    expect(updatedAsset?.status).toBe('En_Proceso_Baja');

    // Verificación de persistencia intermedia: Se guardó en la tabla de Bajas
    expect(bajaRepo.bajas.length).toBe(1);

    // 3. CUANDO (Paso 2): Se intenta procesar una segunda solicitud paralela sobre el mismo activo
    await expect(
      bajaService.execute(
        'asset-sabs-99',
        'jefe-unidad-2',
        'Solicitud duplicada por error',
        'http://s3.activa360.internal/evidencias/foto2.jpg',
      ),
    ).rejects.toThrow(ConflictException);

    // ENTONCES (Verificación Paso 2): La base de datos no registra duplicados
    expect(bajaRepo.bajas.length).toBe(1);
  });
});
