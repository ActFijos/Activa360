import { Injectable } from '@nestjs/common';
import { BajaRepositoryPort } from '../../../domain/ports/out/baja-repository.port.js';
import { Baja, BajaStatus } from '../../../domain/models/baja.model.js';
import { ListBajasFilters, PaginatedBajas } from '../../../domain/ports/in/list-bajas.use-case.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class PrismaBajaAdapter implements BajaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(baja: Baja): Promise<Baja> {
    const data = {
      id: baja.id,
      assetId: baja.assetId,
      jefeId: baja.jefeId,
      justification: baja.justification,
      evidence: baja.evidence,
      initiatedAt: baja.initiatedAt,
      status: baja.status,
      motivoRechazo: baja.motivoRechazo ?? null,
    };

    const record = await this.prisma.baja.upsert({
      where: { id: baja.id || '' },
      update: data,
      create: data,
    });

    return new Baja(
      record.id,
      record.assetId,
      record.jefeId,
      record.justification,
      record.evidence,
      record.initiatedAt,
      record.status as BajaStatus,
      record.motivoRechazo,
    );
  }

  async findById(id: string): Promise<Baja | null> {
    const record = await this.prisma.baja.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return new Baja(
      record.id,
      record.assetId,
      record.jefeId,
      record.justification,
      record.evidence,
      record.initiatedAt,
      record.status as BajaStatus,
      record.motivoRechazo,
    );
  }

  async findByAssetId(assetId: string): Promise<Baja | null> {
    const record = await this.prisma.baja.findUnique({
      where: { assetId },
    });

    if (!record) {
      return null;
    }

    return new Baja(
      record.id,
      record.assetId,
      record.jefeId,
      record.justification,
      record.evidence,
      record.initiatedAt,
      record.status as BajaStatus,
      record.motivoRechazo,
    );
  }

  async findPaginated(filters: ListBajasFilters): Promise<PaginatedBajas> {
    const where: any = {};

    if (filters.estado) {
      const st = filters.estado;
      where.status = {
        in: [st, st.toUpperCase(), st.charAt(0).toUpperCase() + st.slice(1).toLowerCase()],
      };
    }

    if (filters.fechaDesde || filters.fechaHasta) {
      where.initiatedAt = {};
      if (filters.fechaDesde) {
        where.initiatedAt.gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        where.initiatedAt.lte = new Date(filters.fechaHasta);
      }
    }

    if (filters.activo && filters.activo.trim()) {
      const term = filters.activo.trim();
      const matchingAssets = await this.prisma.asset.findMany({
        where: {
          OR: [
            { id: term },
            { qrCode: { contains: term, mode: 'insensitive' } },
            { name: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const assetIds = matchingAssets.map((a) => a.id);
      where.assetId = { in: [term, ...assetIds] };
    }

    const total = await this.prisma.baja.count({ where });
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const records = await this.prisma.baja.findMany({
      where,
      skip,
      take: limit,
      orderBy: { initiatedAt: 'desc' },
    });

    const data = records.map(
      (r) =>
        new Baja(
          r.id,
          r.assetId,
          r.jefeId,
          r.justification,
          r.evidence,
          r.initiatedAt,
          r.status as BajaStatus,
          r.motivoRechazo,
        ),
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
