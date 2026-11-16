import { Injectable } from '@nestjs/common';
import { PrismaService } from '../compliance/adapters/out/db/prisma.service';
import { ReportQueryOptions, ReportStatsResult } from './reports.port';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStats(options: ReportQueryOptions): Promise<ReportStatsResult> {
    const where: any = {};
    if (options.location && options.location !== 'Todas') {
      where.location = options.location;
    }
    if (options.startDate || options.endDate) {
      where.purchaseDate = {};
      if (options.startDate) where.purchaseDate.gte = new Date(options.startDate);
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    const assets = await this.prisma.asset.findMany({ where });

    let totalValue = 0;
    let monthlyDepreciation = 0;
    let maintenanceCount = 0;

    const categoryCounts: Record<string, number> = {
      'Sistemas/TI': 0,
      'Muebles y Enseres': 0,
      Vehículos: 0,
      Maquinaria: 0,
      'Equipos de Oficina': 0,
    };

    const statusCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    assets.forEach((asset) => {
      const val = asset.purchaseValue || 0;
      totalValue += val;

      const life = asset.usefulLife || 5;
      monthlyDepreciation += val / (life * 12);

      if (asset.status === 'Dañado') {
        maintenanceCount++;
      }

      const cat = asset.category || 'Otros';
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else {
        categoryCounts[cat] = 1;
      }

      const st = asset.status || 'Nuevo';
      statusCounts[st] = (statusCounts[st] || 0) + 1;

      const loc = asset.location || 'Almacén Central';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    return {
      totalAssets: assets.length,
      totalValue: Math.round(totalValue),
      monthlyDepreciation: Math.round(monthlyDepreciation),
      maintenanceCount,
      categoryDistribution: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
      statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      locationDistribution: Object.entries(locationCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  }
}

