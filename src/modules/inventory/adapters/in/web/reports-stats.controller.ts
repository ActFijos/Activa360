import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Controller('activos/reportes')
export class ReportsStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('estadisticas')
  async getStats() {
    const assets = await this.prisma.asset.findMany();

    let totalValue = 0;
    let monthlyDepreciation = 0;
    let maintenanceCount = 0;

    const categoryCounts: Record<string, number> = {
      'Sistemas/TI': 0,
      'Muebles y Enseres': 0,
      'Vehículos': 0,
      'Maquinaria': 0,
      'Equipos de Oficina': 0,
    };

    const statusCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    assets.forEach(asset => {
      // 1. Acumular valor total
      const val = asset.purchaseValue || 0;
      totalValue += val;

      // 2. Acumular depreciación mensual
      const life = asset.usefulLife || 5;
      monthlyDepreciation += val / (life * 12);

      // 3. Activos en mantenimiento
      if (asset.status === 'Dañado') {
        maintenanceCount++;
      }

      // 4. Distribución por categorías
      const cat = asset.category || 'Otros';
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else {
        categoryCounts[cat] = 1;
      }

      // 5. Distribución por estados
      const st = asset.status || 'Nuevo';
      statusCounts[st] = (statusCounts[st] || 0) + 1;

      // 6. Distribución por ubicación
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
