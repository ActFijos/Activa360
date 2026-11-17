import { Injectable } from '@nestjs/common';
import { DiagnosticoRepositoryPort } from '../../../domain/ports/out/diagnostico-repository.port.js';
import {
  DiagnosticoTecnico,
  DiagnosticoEstado,
} from '../../../domain/models/diagnostico-tecnico.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Injectable()
export class PrismaDiagnosticoAdapter implements DiagnosticoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapRecordToDomain(record: any): DiagnosticoTecnico {
    return new DiagnosticoTecnico(
      record.id,
      record.numeroInforme,
      record.assetId,
      record.causalSabs,
      record.diagnosticoDetalle,
      record.recomendacion,
      record.dictaminaBaja,
      record.estado as DiagnosticoEstado,
      record.fechaEmision,
      record.tecnicoId || undefined,
      record.tecnicoNombre || undefined,
      record.evidenciaDocumento || undefined,
      record.costoEstimadoReparacion ?? 0,
      record.observaciones || undefined,
    );
  }

  async save(diagnostico: DiagnosticoTecnico): Promise<DiagnosticoTecnico> {
    const data = {
      id: diagnostico.id,
      numeroInforme: diagnostico.numeroInforme,
      assetId: diagnostico.assetId,
      tecnicoId: diagnostico.tecnicoId || null,
      tecnicoNombre: diagnostico.tecnicoNombre || null,
      causalSabs: diagnostico.causalSabs,
      diagnosticoDetalle: diagnostico.diagnosticoDetalle,
      recomendacion: diagnostico.recomendacion,
      dictaminaBaja: diagnostico.dictaminaBaja,
      evidenciaDocumento: diagnostico.evidenciaDocumento || null,
      costoEstimadoReparacion: diagnostico.costoEstimadoReparacion ?? 0,
      estado: diagnostico.estado,
      fechaEmision: diagnostico.fechaEmision || new Date(),
      observaciones: diagnostico.observaciones || null,
    };

    const record = await this.prisma.diagnosticoTecnico.upsert({
      where: { id: diagnostico.id },
      update: data,
      create: data,
    });

    return this.mapRecordToDomain(record);
  }

  async findById(id: string): Promise<DiagnosticoTecnico | null> {
    const record = await this.prisma.diagnosticoTecnico.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.mapRecordToDomain(record);
  }

  async findByNumeroInforme(numeroInforme: string): Promise<DiagnosticoTecnico | null> {
    const record = await this.prisma.diagnosticoTecnico.findUnique({
      where: { numeroInforme },
    });
    if (!record) return null;
    return this.mapRecordToDomain(record);
  }

  async findAll(filters: {
    estado?: string;
    activo_id?: string;
  }): Promise<DiagnosticoTecnico[]> {
    const whereClause: any = {};

    if (filters.estado) {
      whereClause.estado = {
        equals: filters.estado,
        mode: 'insensitive',
      };
    }

    if (filters.activo_id) {
      whereClause.assetId = filters.activo_id;
    }

    const records = await this.prisma.diagnosticoTecnico.findMany({
      where: whereClause,
      orderBy: { fechaEmision: 'desc' },
    });

    return records.map((record) => this.mapRecordToDomain(record));
  }

  async findVigenteByAssetId(assetId: string): Promise<DiagnosticoTecnico | null> {
    const record = await this.prisma.diagnosticoTecnico.findFirst({
      where: {
        assetId,
        estado: {
          equals: 'VIGENTE',
          mode: 'insensitive',
        },
      },
      orderBy: { fechaEmision: 'desc' },
    });

    if (!record) return null;
    return this.mapRecordToDomain(record);
  }

  async updateEstado(id: string, estado: string): Promise<DiagnosticoTecnico> {
    const record = await this.prisma.diagnosticoTecnico.update({
      where: { id },
      data: { estado },
    });
    return this.mapRecordToDomain(record);
  }
}
