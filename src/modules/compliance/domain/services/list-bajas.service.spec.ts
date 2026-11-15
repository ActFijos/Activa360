import { Test, TestingModule } from '@nestjs/testing';
import { ListBajasService } from './list-bajas.service.js';
import { BajaRepositoryPort } from '../ports/out/baja-repository.port.js';
import { Baja, BajaStatus } from '../models/baja.model.js';
import { BajaFilterStatus } from '../../adapters/in/web/dto/list-bajas-query.dto.js';

describe('ListBajasService — Feature 1 (Filtros) & Feature 2 (Paginación)', () => {
  let service: ListBajasService;
  let fakeBajaRepo: jest.Mocked<BajaRepositoryPort>;

  const mockBajas: Baja[] = [
    new Baja(
      'baja-1',
      'asset-1',
      'jefe-1',
      'Equipo quemado',
      'ACTA-01',
      new Date('2026-03-01T10:00:00Z'),
      BajaStatus.INICIADA,
    ),
    new Baja(
      'baja-2',
      'asset-2',
      'jefe-1',
      'Laptop destruida',
      'ACTA-02',
      new Date('2026-03-15T14:00:00Z'),
      BajaStatus.APROBADA,
    ),
    new Baja(
      'baja-3',
      'asset-3',
      'jefe-2',
      'Impresora obsoleta',
      'ACTA-03',
      new Date('2026-04-10T09:00:00Z'),
      BajaStatus.RECHAZADA,
      'Aún funciona',
    ),
  ];

  beforeEach(async () => {
    fakeBajaRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAssetId: jest.fn(),
      findPaginated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListBajasService,
        { provide: BajaRepositoryPort, useValue: fakeBajaRepo },
      ],
    }).compile();

    service = module.get<ListBajasService>(ListBajasService);
  });

  describe('Feature 1: Filtros en listado de Bajas', () => {
    it('debería filtrar por estado INICIADA', async () => {
      fakeBajaRepo.findPaginated.mockResolvedValue({
        data: [mockBajas[0]],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await service.execute({ estado: BajaFilterStatus.INICIADA });

      expect(fakeBajaRepo.findPaginated).toHaveBeenCalledWith({
        estado: BajaFilterStatus.INICIADA,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(BajaStatus.INICIADA);
      expect(result.meta.total).toBe(1);
    });

    it('debería filtrar por término de búsqueda del activo', async () => {
      fakeBajaRepo.findPaginated.mockResolvedValue({
        data: [mockBajas[1]],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await service.execute({ activo: 'asset-2' });

      expect(fakeBajaRepo.findPaginated).toHaveBeenCalledWith({ activo: 'asset-2' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].assetId).toBe('asset-2');
    });

    it('debería filtrar por rango de fechas (fechaDesde y fechaHasta)', async () => {
      fakeBajaRepo.findPaginated.mockResolvedValue({
        data: [mockBajas[0], mockBajas[1]],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      });

      const filters = {
        fechaDesde: '2026-03-01T00:00:00.000Z',
        fechaHasta: '2026-03-31T23:59:59.999Z',
      };
      const result = await service.execute(filters);

      expect(fakeBajaRepo.findPaginated).toHaveBeenCalledWith(filters);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('debería aplicar filtros combinados simultáneamente (estado, activo y fechas)', async () => {
      fakeBajaRepo.findPaginated.mockResolvedValue({
        data: [mockBajas[0]],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const combinedFilters = {
        estado: BajaFilterStatus.INICIADA,
        activo: 'asset-1',
        fechaDesde: '2026-03-01T00:00:00.000Z',
        fechaHasta: '2026-03-10T23:59:59.999Z',
        page: 1,
        limit: 10,
      };
      const result = await service.execute(combinedFilters);

      expect(fakeBajaRepo.findPaginated).toHaveBeenCalledWith(combinedFilters);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('baja-1');
    });
  });

  describe('Feature 2: Paginación en GET /bajas', () => {
    it('debería retornar metadatos de paginación calculados (page, limit, total, totalPages)', async () => {
      fakeBajaRepo.findPaginated.mockResolvedValue({
        data: mockBajas.slice(0, 2),
        meta: { total: 25, page: 1, limit: 2, totalPages: 13 },
      });

      const result = await service.execute({ page: 1, limit: 2 });

      expect(fakeBajaRepo.findPaginated).toHaveBeenCalledWith({ page: 1, limit: 2 });
      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(13);
    });

    it('debería soportar navegación a páginas intermedias con skip y take coherentes', async () => {
      fakeBajaRepo.findPaginated.mockResolvedValue({
        data: [mockBajas[2]],
        meta: { total: 25, page: 2, limit: 2, totalPages: 13 },
      });

      const result = await service.execute({ page: 2, limit: 2 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(13);
      expect(result.data).toHaveLength(1);
    });
  });
});
