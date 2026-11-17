import { Test, TestingModule } from '@nestjs/testing';
import { RegisterAssetUseCase } from './domain/ports/in/register-asset.use-case.js';
import { RegisterAssetService } from './domain/services/register-asset.service.js';
import { ChangeAssetStatusUseCase } from './domain/ports/in/change-asset-status.use-case.js';
import { ChangeAssetStatusService } from './domain/services/change-asset-status.service.js';
import { CreateDiagnosticoUseCase } from './domain/ports/in/create-diagnostico.use-case.js';
import { CreateDiagnosticoService } from './domain/services/create-diagnostico.service.js';
import { ListDiagnosticosUseCase } from './domain/ports/in/list-diagnosticos.use-case.js';
import { ListDiagnosticosService } from './domain/services/list-diagnosticos.service.js';
import { GetDiagnosticoByIdUseCase } from './domain/ports/in/get-diagnostico-by-id.use-case.js';
import { GetDiagnosticoByIdService } from './domain/services/get-diagnostico-by-id.service.js';
import { AssetRepositoryPort } from './domain/ports/out/asset-repository.port.js';
import { DiagnosticoRepositoryPort } from './domain/ports/out/diagnostico-repository.port.js';
import { Asset, AssetStatus } from './domain/models/asset.model.js';
import {
  DiagnosticoTecnico,
  DiagnosticoEstado,
  CausalSabs,
  RecomendacionTecnica,
} from './domain/models/diagnostico-tecnico.model.js';
import { AssetStatusHistory } from './domain/models/asset-status-history.model.js';
import { InitiateBajaService } from '../compliance/domain/services/initiate-baja.service.js';
import { RejectBajaService } from '../compliance/domain/services/reject-baja.service.js';
import { BajaRepositoryPort } from '../compliance/domain/ports/out/baja-repository.port.js';
import { AssetServicePort } from '../compliance/domain/ports/out/asset-service.port.js';
import { Baja, BajaStatus } from '../compliance/domain/models/baja.model.js';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service.js';
import { ConflictException } from '@nestjs/common';

describe('Flujo Integrado End-to-End: Gestión de Activos -> Diagnóstico SABS -> Bajas -> Rechazo y Restauración Condicional', () => {
  let registerAssetService: RegisterAssetUseCase;
  let changeStatusService: ChangeAssetStatusUseCase;
  let createDiagnosticoService: CreateDiagnosticoUseCase;
  let listDiagnosticosService: ListDiagnosticosUseCase;
  let getDiagnosticoService: GetDiagnosticoByIdUseCase;
  let initiateBajaService: InitiateBajaService;
  let rejectBajaService: RejectBajaService;

  // Estado en memoria para simular base de datos completa
  const assetsDb = new Map<string, Asset>();
  const historyDb: AssetStatusHistory[] = [];
  const diagnosticosDb = new Map<string, DiagnosticoTecnico>();
  const bajasDb = new Map<string, Baja>();

  beforeAll(async () => {
    const mockAssetRepo: AssetRepositoryPort = {
      findById: async (id: string) => assetsDb.get(id) || null,
      findByIdWithHistory: async (id: string) => {
        const asset = assetsDb.get(id);
        if (!asset) return null;
        asset.statusHistory = historyDb.filter((h) => h.assetId === id);
        asset.diagnosticos = Array.from(diagnosticosDb.values()).filter((d) => d.assetId === id);
        return asset;
      },
      findByQrCode: async (qrCode: string) => {
        for (const a of assetsDb.values()) {
          if (a.qrCode === qrCode) return a;
        }
        return null;
      },
      save: async (asset: Asset) => {
        assetsDb.set(asset.id, asset);
        return asset;
      },
      findAll: async () => Array.from(assetsDb.values()),
      findAllWithFilters: async (filters) => {
        let list = Array.from(assetsDb.values());
        if (filters.estado) {
          list = list.filter((a) => a.status.toLowerCase() === filters.estado!.toLowerCase());
        }
        if (filters.codigo) {
          list = list.filter((a) => a.qrCode.includes(filters.codigo!));
        }
        return list;
      },
      recordStatusChange: async (h: AssetStatusHistory) => {
        historyDb.push(h);
        return h;
      },
      saveMaintenanceReport: async () => {},
    };

    const mockDiagRepo: DiagnosticoRepositoryPort = {
      save: async (d: DiagnosticoTecnico) => {
        diagnosticosDb.set(d.id, d);
        return d;
      },
      findById: async (id: string) => diagnosticosDb.get(id) || null,
      findByNumeroInforme: async (num: string) => {
        for (const d of diagnosticosDb.values()) {
          if (d.numeroInforme === num) return d;
        }
        return null;
      },
      findAll: async (filters) => {
        let list = Array.from(diagnosticosDb.values());
        if (filters.estado) {
          list = list.filter((d) => d.estado.toUpperCase() === filters.estado!.toUpperCase());
        }
        if (filters.activo_id) {
          list = list.filter((d) => d.assetId === filters.activo_id);
        }
        return list;
      },
      findVigenteByAssetId: async (assetId: string) => {
        for (const d of diagnosticosDb.values()) {
          if (d.assetId === assetId && d.estado === DiagnosticoEstado.VIGENTE) return d;
        }
        return null;
      },
      updateEstado: async (id: string, estado: string) => {
        const d = diagnosticosDb.get(id);
        if (d) d.estado = estado;
        return d!;
      },
    };

    const mockBajaRepo: BajaRepositoryPort = {
      save: async (baja: Baja) => {
        bajasDb.set(baja.id, baja);
        return baja;
      },
      findById: async (id: string) => bajasDb.get(id) || null,
      findByAssetId: async (assetId: string) => {
        for (const b of bajasDb.values()) {
          if (b.assetId === assetId) return b;
        }
        return null;
      },
      findAll: async () => Array.from(bajasDb.values()),
      findAllPaginated: async () => ({
        data: Array.from(bajasDb.values()),
        total: bajasDb.size,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    };

    const mockAssetServicePort: AssetServicePort = {
      getAsset: async (id: string) => {
        const a = assetsDb.get(id);
        if (!a) return null;
        return { id: a.id, status: a.status };
      },
      updateAssetStatus: async (id: string, status: string) => {
        const a = assetsDb.get(id);
        if (a) {
          a.status = status as AssetStatus;
        }
      },
    };

    const mockPrisma: any = {
      diagnosticoTecnico: {
        findFirst: async (query: any) => {
          const assetId = query.where?.assetId;
          const estado = query.where?.estado?.equals?.toUpperCase();
          for (const d of diagnosticosDb.values()) {
            if (d.assetId === assetId && (!estado || d.estado.toUpperCase() === estado)) {
              return d;
            }
          }
          return null;
        },
        update: async (params: any) => {
          const d = diagnosticosDb.get(params.where.id);
          if (d) d.estado = params.data.estado;
          return d;
        },
      },
      assetStatusHistory: {
        create: async (data: any) => {
          historyDb.push(data.data);
          return data.data;
        },
      },
      asset: {
        findUnique: async (q: any) => assetsDb.get(q.where.id) || null,
        update: async (params: any) => {
          const a = assetsDb.get(params.where.id);
          if (a) a.status = params.data.status;
          return a;
        },
      },
      baja: {
        findUnique: async (q: any) => bajasDb.get(q.where.id) || null,
        update: async (params: any) => {
          const b = bajasDb.get(params.where.id);
          if (b) b.status = params.data.status;
          return b;
        },
      },
      maintenanceReport: {
        findFirst: async () => null,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AssetRepositoryPort, useValue: mockAssetRepo },
        { provide: DiagnosticoRepositoryPort, useValue: mockDiagRepo },
        { provide: BajaRepositoryPort, useValue: mockBajaRepo },
        { provide: AssetServicePort, useValue: mockAssetServicePort },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RegisterAssetUseCase, useClass: RegisterAssetService },
        { provide: ChangeAssetStatusUseCase, useClass: ChangeAssetStatusService },
        { provide: CreateDiagnosticoUseCase, useClass: CreateDiagnosticoService },
        { provide: ListDiagnosticosUseCase, useClass: ListDiagnosticosService },
        { provide: GetDiagnosticoByIdUseCase, useClass: GetDiagnosticoByIdService },
        InitiateBajaService,
        RejectBajaService,
      ],
    }).compile();

    registerAssetService = module.get(RegisterAssetUseCase);
    changeStatusService = module.get(ChangeAssetStatusUseCase);
    createDiagnosticoService = module.get(CreateDiagnosticoUseCase);
    listDiagnosticosService = module.get(ListDiagnosticosUseCase);
    getDiagnosticoService = module.get(GetDiagnosticoByIdUseCase);
    initiateBajaService = module.get(InitiateBajaService);
    rejectBajaService = module.get(RejectBajaService);
  });

  it('debe ejecutar el ciclo de vida completo: Alta -> Transición -> Diagnóstico VIGENTE -> Solicitud Baja -> Rechazo con Restauración -> Aprobación', async () => {
    // 1. Alta de Activo Patrimonial (POST /activos) con estado DISPONIBLE
    const newAsset = await registerAssetService.execute({
      qrCode: 'SABS-2026-SRV01',
      name: 'Servidor Blade UCS Cisco B200 M5',
      status: 'DISPONIBLE',
      location: 'Centro de Datos UMSS - Rack 04',
      category: 'Equipos de Computación',
      usefulLife: 5,
      origin: 'Compra Mayor SABS',
      purchaseDate: new Date('2026-02-01'),
      entryDate: new Date('2026-02-10'),
      purchaseValue: 6200.0,
      warrantyMonths: 36,
      providerName: 'Cisco Systems Bolivia',
    });

    expect(newAsset.id).toBeDefined();
    expect(newAsset.status).toBe(AssetStatus.DISPONIBLE);
    const assetId = newAsset.id;

    // 2. Transición controlada a EN_DIAGNOSTICO (PATCH /activos/:id/estado)
    const diagnosedAsset = await changeStatusService.execute({
      assetId,
      nuevoEstado: AssetStatus.EN_DIAGNOSTICO,
      motivo: 'Fallas recurrentes en placa madre y módulos de memoria RAM',
      responsable: 'Lic. Josefina Rojas',
    });
    expect(diagnosedAsset.status).toBe(AssetStatus.EN_DIAGNOSTICO);

    // 3. Emisión de Diagnóstico Técnico SABS (POST /activos/:id/diagnosticos)
    const diag = await createDiagnosticoService.execute({
      assetId,
      numeroInforme: 'INF-TEC-SABS-2026-0099',
      causalSabs: CausalSabs.OBSOLESCENCIA,
      diagnosticoDetalle: 'Deterioro irreparable por sobretensión eléctrica y obsolescencia tecnológica',
      recomendacion: RecomendacionTecnica.RECOMENDAR_BAJA,
      dictaminaBaja: true,
      tecnicoNombre: 'Ing. Carlos Meneses',
      evidenciaDocumento: 'https://docs.activa360.gob.bo/informes/INF-TEC-0099.pdf',
    });

    expect(diag.id).toBeDefined();
    expect(diag.estado).toBe(DiagnosticoEstado.VIGENTE);
    // Verificamos que el activo transicionó a APTO_PARA_BAJA
    const assetAfterDiag = assetsDb.get(assetId);
    expect(assetAfterDiag?.status).toBe(AssetStatus.APTO_PARA_BAJA);

    // 4. Consulta de Diagnósticos (GET /diagnosticos)
    const vigentes = await listDiagnosticosService.execute({
      estado: DiagnosticoEstado.VIGENTE,
      activo_id: assetId,
    });
    expect(vigentes).toHaveLength(1);
    expect(vigentes[0].numeroInforme).toBe('INF-TEC-SABS-2026-0099');

    // 5. Iniciar Trámite de Baja SABS (POST /bajas) -> consume diagnóstico
    const baja = await initiateBajaService.execute(
      assetId,
      'jefe-patrimonio-1',
      'Solicitud formal de baja por obsolescencia técnica justificada en INF-TEC-SABS-2026-0099',
      'https://docs.activa360.gob.bo/informes/INF-TEC-0099.pdf',
    );

    expect(baja.id).toBeDefined();
    expect(baja.status).toBe(BajaStatus.INICIADA);
    // El diagnóstico pasó a UTILIZADO_EN_BAJA
    expect(diag.estado).toBe('UTILIZADO_EN_BAJA');
    // El activo pasó a En_Proceso_Baja
    expect(assetsDb.get(assetId)?.status).toBe('En_Proceso_Baja');

    // 6. Rechazo normativo de la baja (POST /bajas/:id/rechazar) -> Restauración Condicional
    const bajaRechazada = await rejectBajaService.execute(
      baja.id,
      'Se rechaza la solicitud de baja temporalmente para requerir un segundo peritaje presupuestario',
    );

    expect(bajaRechazada.status).toBe(BajaStatus.RECHAZADA);
    expect(bajaRechazada.motivoRechazo).toContain('segundo peritaje presupuestario');

    // Verificamos la restauración condicional del diagnóstico técnico
    expect(diag.estado).toBe('RESTAURADO');

    // Verificamos la restauración condicional del estado del activo
    const assetRestaurado = assetsDb.get(assetId);
    expect(
      assetRestaurado?.status === AssetStatus.OBSOLETO ||
        assetRestaurado?.status === AssetStatus.APTO_PARA_BAJA ||
        assetRestaurado?.status === AssetStatus.DANADO,
    ).toBeTruthy();

    // 7. Simular aprobación final de baja y verificar bloqueo en estado Dado_De_Baja
    const assetFinal = assetsDb.get(assetId)!;
    assetFinal.status = AssetStatus.DADO_DE_BAJA;

    // Intentar cambiar de estado un activo Dado_De_Baja debe ser denegado por normativa
    await expect(
      changeStatusService.execute({
        assetId,
        nuevoEstado: AssetStatus.DISPONIBLE,
        motivo: 'Intento ilegal de reactivación',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
