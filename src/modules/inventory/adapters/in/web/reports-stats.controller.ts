import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Controller('activos/reportes')
export class ReportsStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('estadisticas')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (location && location !== 'Todas') {
      where.location = location;
    }
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
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
      'Vehículos': 0,
      'Maquinaria': 0,
      'Equipos de Oficina': 0,
    };

    const statusCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    assets.forEach(asset => {
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

  @Get('depreciacion')
  async getDepreciacion(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (location && location !== 'Todas') {
      where.location = location;
    }
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    const assets = await this.prisma.asset.findMany({ where });
    const currentYear = new Date().getFullYear();

    return assets.map(asset => {
      const purchaseValue = asset.purchaseValue || 0;
      const usefulLife = asset.usefulLife || 5;
      const purchaseYear = new Date(asset.purchaseDate).getFullYear();
      const yearsElapsed = Math.max(0, currentYear - purchaseYear);
      
      const depreciationPerYear = purchaseValue / usefulLife;
      const accumulatedDepreciation = Math.min(purchaseValue, depreciationPerYear * yearsElapsed);
      const currentValue = Math.max(0, purchaseValue - accumulatedDepreciation);

      return {
        id: asset.id,
        qrCode: asset.qrCode,
        name: asset.name,
        category: asset.category,
        purchaseDate: asset.purchaseDate,
        purchaseValue,
        usefulLife,
        accumulatedDepreciation: Math.round(accumulatedDepreciation),
        currentValue: Math.round(currentValue),
      };
    });
  }

  @Get('inventario')
  async getInventario(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (location && location !== 'Todas') {
      where.location = location;
    }
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    return this.prisma.asset.findMany({
      where,
      orderBy: { qrCode: 'asc' },
    });
  }

  @Get('valoracion')
  async getValoracion(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (location && location !== 'Todas') {
      where.location = location;
    }
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    const assets = await this.prisma.asset.findMany({ where });
    const currentYear = new Date().getFullYear();

    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    let totalAccumulatedDepreciation = 0;

    const list = assets.map(asset => {
      const purchaseValue = asset.purchaseValue || 0;
      const usefulLife = asset.usefulLife || 5;
      const purchaseYear = new Date(asset.purchaseDate).getFullYear();
      const yearsElapsed = Math.max(0, currentYear - purchaseYear);
      
      const depreciationPerYear = purchaseValue / usefulLife;
      const accumulatedDepreciation = Math.min(purchaseValue, depreciationPerYear * yearsElapsed);
      const currentValue = Math.max(0, purchaseValue - accumulatedDepreciation);

      totalPurchaseValue += purchaseValue;
      totalAccumulatedDepreciation += accumulatedDepreciation;
      totalCurrentValue += currentValue;

      return {
        id: asset.id,
        qrCode: asset.qrCode,
        name: asset.name,
        category: asset.category,
        purchaseValue,
        accumulatedDepreciation: Math.round(accumulatedDepreciation),
        currentValue: Math.round(currentValue),
      };
    });

    return {
      totalPurchaseValue: Math.round(totalPurchaseValue),
      totalCurrentValue: Math.round(totalCurrentValue),
      totalAccumulatedDepreciation: Math.round(totalAccumulatedDepreciation),
      assets: list,
    };
  }

  @Get('mantenimiento')
  async getMantenimiento(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (location && location !== 'Todas') {
      where.asset = { location: location };
    }
    if (startDate || endDate) {
      where.inspectedAt = {};
      if (startDate) where.inspectedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.inspectedAt.lte = end;
      }
    }

    const reports = await this.prisma.maintenanceReport.findMany({
      where,
      include: { asset: true },
      orderBy: { inspectedAt: 'desc' },
    });

    return reports.map(r => ({
      id: r.id,
      inspectedAt: r.inspectedAt,
      diagnosis: r.diagnosis,
      estimatedCost: r.estimatedCost,
      action: r.action,
      assetCode: r.asset.qrCode,
      assetName: r.asset.name,
      location: r.asset.location,
    }));
  }

  @Get('bajas')
  async getBajas(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.initiatedAt = {};
      if (startDate) where.initiatedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.initiatedAt.lte = end;
      }
    }
    if (location && location !== 'Todas') {
      const assetsInLoc = await this.prisma.asset.findMany({
        where: { location }
      });
      const assetIds = assetsInLoc.map(a => a.id);
      where.assetId = { in: assetIds };
    }

    const bajas = await this.prisma.baja.findMany({
      where,
      orderBy: { initiatedAt: 'desc' },
    });
    
    const result = [];
    for (const baja of bajas) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: baja.assetId },
      });
      result.push({
        id: baja.id,
        initiatedAt: baja.initiatedAt,
        justification: baja.justification,
        evidence: baja.evidence,
        status: baja.status,
        assetCode: asset ? asset.qrCode : 'Desconocido',
        assetName: asset ? asset.name : 'Activo no encontrado',
        category: asset ? asset.category : 'Otros',
        value: asset ? asset.purchaseValue : 0,
      });
    }
    return result;
  }

  @Get('transferencias')
  async getTransferencias(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('location') location?: string,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (location && location !== 'Todas') {
      where.OR = [
        { fromUnit: location },
        { toUnit: location }
      ];
    }

    const transfers = await this.prisma.transfer.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    
    const result = [];
    for (const trans of transfers) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: trans.assetId },
      });
      result.push({
        id: trans.id,
        date: trans.date,
        fromUnit: trans.fromUnit,
        fromResponsible: trans.fromResponsible,
        toUnit: trans.toUnit,
        toResponsible: trans.toResponsible,
        status: trans.status,
        reason: trans.reason,
        assetCode: asset ? asset.qrCode : 'Desconocido',
        assetName: asset ? asset.name : 'Activo no encontrado',
      });
    }
    return result;
  }

  @Get('alertas-notificaciones')
  async getAlertasNotificaciones() {
    const alerts = [];

    // 1. Activos dañados sin inspección técnica
    const assets = await this.prisma.asset.findMany({
      where: { status: 'Dañado' },
      include: { maintenances: true }
    });
    const pendingInspections = assets.filter(a => a.maintenances.length === 0);
    for (const asset of pendingInspections) {
      alerts.push({
        id: `damaged-${asset.id}`,
        title: '⚠️ Inspección Pendiente',
        message: `El activo ${asset.qrCode} (${asset.name}) está Dañado y requiere un informe técnico.`,
        type: 'inspeccion',
        link: '/registro',
        date: asset.updatedAt,
      });
    }

    // 2. Bajas pendientes (Iniciadas)
    const pendingBajas = await this.prisma.baja.findMany({
      where: { status: 'Iniciada' },
      orderBy: { initiatedAt: 'desc' }
    });
    for (const baja of pendingBajas) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: baja.assetId }
      });
      alerts.push({
        id: `baja-${baja.id}`,
        title: '⬇️ Baja SABS por Aprobar',
        message: `Solicitud de baja para ${asset ? asset.qrCode : 'activo'} esperando firma de supervisor.`,
        type: 'baja',
        link: '/bajas',
        date: baja.initiatedAt,
      });
    }

    // 3. Transferencias pendientes
    const pendingTransfers = await this.prisma.transfer.findMany({
      where: { status: 'Pendiente' },
      orderBy: { date: 'desc' }
    });
    for (const trans of pendingTransfers) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: trans.assetId }
      });
      alerts.push({
        id: `transfer-${trans.id}`,
        title: '🔄 Traspaso por Confirmar',
        message: `Traspaso de ${asset ? asset.name : 'activo'} hacia ${trans.toUnit} pendiente.`,
        type: 'transferencia',
        link: '/transferencias',
        date: trans.date,
      });
    }

    // Ordenar por fecha descendente
    alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return alerts;
  }
}
