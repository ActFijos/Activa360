import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  TransferAssetUseCase,
  TransferAssetCommand,
  ApproveTransferResult,
} from '../ports/in/transfer-asset.use-case';
import { Transfer } from '../models/transfer.model';
import { TransferActa } from '../models/transfer-acta.model';
import { AssetStatus } from '../models/asset.model';
import { PrismaService } from '../../../compliance/adapters/out/db/prisma.service';
import { randomUUID, createHash } from 'crypto';
import { trace, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class TransferAssetService implements TransferAssetUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: TransferAssetCommand): Promise<Transfer> {
    return this.prisma.$transaction(async (tx) => {
      // ── 1. Bloqueo pesimista: SELECT FOR UPDATE ────────────────────────
      const [lockedAsset] = await tx.$queryRaw<
        { id: string; name: string; status: string; location: string }[]
      >`
        SELECT id, name, status, location
        FROM "Asset"
        WHERE id = ${command.assetId}
        FOR UPDATE
      `;

      if (!lockedAsset) {
        throw new NotFoundException(
          `El activo con ID ${command.assetId} no existe`,
        );
      }

      // ── 2. Validar estado del activo ───────────────────────────────────
      if (
        lockedAsset.status === AssetStatus.DADO_DE_BAJA ||
        lockedAsset.status === AssetStatus.EN_PROCESO_BAJA
      ) {
        throw new ConflictException(
          `No se puede transferir el activo "${lockedAsset.name}" porque se encuentra en estado: ${lockedAsset.status.replace('_', ' ')}`,
        );
      }

      // ── 3. Determinar fromUnit y fromResponsible ───────────────────────
      const fromUnit = lockedAsset.location || 'Almacén Central';
      let fromResponsible = 'Almacén';

      const lastAssignment = await tx.assignment.findFirst({
        where: { assetId: command.assetId },
        orderBy: { date: 'desc' },
      });
      if (lastAssignment) {
        fromResponsible = lastAssignment.responsible;
      }

      // ── 4. Crear la transferencia y actualizar estado del activo ───────
      const created = await tx.transfer.create({
        data: {
          id: randomUUID(),
          assetId: command.assetId,
          fromUnit,
          fromResponsible,
          toUnit: command.toUnit,
          toResponsible: command.toResponsible,
          date: command.date,
          status: 'Pendiente',
          reason: command.reason,
        },
      });

      await tx.asset.update({
        where: { id: command.assetId },
        data: { status: 'En_Transferencia' },
      });

      return new Transfer(
        created.id,
        created.assetId,
        created.fromUnit,
        created.fromResponsible,
        created.toUnit,
        created.toResponsible,
        created.date,
        created.status,
        created.reason,
        created.actaCodigo,
        created.actaGenerada,
        created.actaHash,
      );
    });
  }

  async approve(
    transferId: string,
    approverName?: string,
  ): Promise<ApproveTransferResult> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener transferencia pendiente
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
      });
      if (!transfer) {
        throw new NotFoundException(
          `La transferencia con ID ${transferId} no existe`,
        );
      }

      if (transfer.status === 'Aprobada') {
        throw new ConflictException(
          `La transferencia con ID ${transferId} ya ha sido aprobada previamente`,
        );
      }

      // 2. Bloqueo pesimista del activo
      const [lockedAsset] = await tx.$queryRaw<
        {
          id: string;
          qrCode: string;
          name: string;
          category: string;
          status: string;
          location: string;
          usefulLife?: number | null;
          purchaseValue?: number | null;
        }[]
      >`
        SELECT id, "qrCode", name, category, status, location, "usefulLife", "purchaseValue"
        FROM "Asset"
        WHERE id = ${transfer.assetId}
        FOR UPDATE
      `;

      if (!lockedAsset) {
        throw new NotFoundException(
          `El activo con ID ${transfer.assetId} asociado a la transferencia no existe`,
        );
      }

      // 3. Generación correlativa del Acta Bilateral SABS (ej. ACTA-TRANS-2026-0001)
      const count = await tx.transferActa.count();
      const nextSequence = String(count + 1).padStart(4, '0');
      const year = new Date().getFullYear();
      const actaCodigo = `ACTA-TRANS-${year}-${nextSequence}`;
      const fechaEmision = new Date();

      // 4. Snapshots estructurados
      const activoSnapshot = {
        id: lockedAsset.id,
        qrCode: lockedAsset.qrCode,
        name: lockedAsset.name,
        category: lockedAsset.category || 'Equipo de Computación / Mobiliario',
        status: 'Operativo / Transferido',
        location: transfer.toUnit,
        usefulLife: lockedAsset.usefulLife ?? null,
        purchaseValue: lockedAsset.purchaseValue ?? null,
      };

      const origenSnapshot = {
        unit: transfer.fromUnit,
        responsible: transfer.fromResponsible,
        cargo: 'Custodio Entregante',
      };

      const destinoSnapshot = {
        unit: transfer.toUnit,
        responsible: transfer.toResponsible,
        cargo: 'Custodio Receptor',
      };

      // 5. Hash criptográfico SHA-256 de integridad y no repudio
      const immutablePayload = {
        transferId: transfer.id,
        assetId: lockedAsset.id,
        qrCode: lockedAsset.qrCode,
        fromUnit: transfer.fromUnit,
        fromResponsible: transfer.fromResponsible,
        toUnit: transfer.toUnit,
        toResponsible: transfer.toResponsible,
        codigo: actaCodigo,
        timestamp: fechaEmision.toISOString(),
      };
      const hashIntegridad = createHash('sha256')
        .update(JSON.stringify(immutablePayload))
        .digest('hex');

      // 6. Instrumentación con OpenTelemetry (Span visible en Grafana Tempo)
      const tracer = trace.getTracer('activa360-inventory');
      tracer.startActiveSpan(
        'TransferAssetService.generateBilateralActa',
        (span) => {
          try {
            span.setAttribute('transfer.id', transfer.id);
            span.setAttribute('asset.qr', lockedAsset.qrCode);
            span.setAttribute('acta.codigo', actaCodigo);
            span.setAttribute('acta.sha256', hashIntegridad);
            span.setStatus({ code: SpanStatusCode.OK });
          } catch (err: any) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err?.message,
            });
          } finally {
            span.end();
          }
        },
      );

      // 7. Persistir TransferActa
      const createdActa = await tx.transferActa.create({
        data: {
          id: randomUUID(),
          transferId: transfer.id,
          codigo: actaCodigo,
          fechaEmision,
          hashIntegridad,
          activoSnapshot,
          origenSnapshot,
          destinoSnapshot,
          observaciones: `Transferencia bilateral formalizada según Normativa SABS D.S. 0181. Motivo: ${transfer.reason}`,
          generadoPor: approverName || 'Sistema SCAF / Jefe de Activos Fijos',
        },
      });

      // 8. Actualizar Transferencia a Aprobada con metadatos del acta
      const updatedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'Aprobada',
          actaCodigo,
          actaGenerada: true,
          actaHash: hashIntegridad,
        },
      });

      // 9. Actualizar Activo (nueva ubicación y estado Asignado)
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: {
          location: transfer.toUnit,
          status: 'Asignado',
        },
      });

      // 10. Registrar nueva Asignación al Custodio Receptor
      await tx.assignment.create({
        data: {
          id: randomUUID(),
          assetId: transfer.assetId,
          responsible: transfer.toResponsible,
          date: fechaEmision,
          destination: transfer.toUnit,
          observations: `Transferencia bilateral formalizada (${actaCodigo}) desde ${transfer.fromUnit} (${transfer.fromResponsible}). Aprobada formalmente.`,
        },
      });

      const domainActa = new TransferActa(
        createdActa.id,
        createdActa.transferId,
        createdActa.codigo,
        createdActa.fechaEmision,
        createdActa.hashIntegridad,
        createdActa.activoSnapshot as any,
        createdActa.origenSnapshot as any,
        createdActa.destinoSnapshot as any,
        createdActa.observaciones,
        createdActa.generadoPor,
      );

      const domainTransfer = new Transfer(
        updatedTransfer.id,
        updatedTransfer.assetId,
        updatedTransfer.fromUnit,
        updatedTransfer.fromResponsible,
        updatedTransfer.toUnit,
        updatedTransfer.toResponsible,
        updatedTransfer.date,
        updatedTransfer.status,
        updatedTransfer.reason,
        updatedTransfer.actaCodigo,
        updatedTransfer.actaGenerada,
        updatedTransfer.actaHash,
      );

      return {
        success: true,
        message: 'Transferencia aprobada exitosamente y Acta Bilateral generada.',
        transfer: domainTransfer,
        acta: domainActa,
      };
    });
  }

  async getActa(transferId: string): Promise<TransferActa> {
    const acta = await this.prisma.transferActa.findUnique({
      where: { transferId },
    });

    if (!acta) {
      // Si la transferencia existe y está aprobada pero aún no tiene acta creada
      const transfer = await this.prisma.transfer.findUnique({
        where: { id: transferId },
        include: { asset: true },
      });

      if (!transfer) {
        throw new NotFoundException(
          `La transferencia con ID ${transferId} no existe`,
        );
      }

      if (transfer.status !== 'Aprobada') {
        throw new NotFoundException(
          `No existe acta bilateral para la transferencia ${transferId} porque se encuentra en estado: ${transfer.status}`,
        );
      }

      // Si por alguna razón histórica estuviera aprobada sin acta, la formalizamos
      const approval = await this.approve(transferId);
      return approval.acta;
    }

    return new TransferActa(
      acta.id,
      acta.transferId,
      acta.codigo,
      acta.fechaEmision,
      acta.hashIntegridad,
      acta.activoSnapshot as any,
      acta.origenSnapshot as any,
      acta.destinoSnapshot as any,
      acta.observaciones,
      acta.generadoPor,
    );
  }
}
