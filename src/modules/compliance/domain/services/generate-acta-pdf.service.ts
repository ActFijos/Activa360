import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  GenerateActaPdfUseCase,
  ActaPdfResult,
} from '../ports/in/generate-acta-pdf.use-case.js';
import { PrismaService } from '../../adapters/out/db/prisma.service.js';

@Injectable()
export class GenerateActaPdfService implements GenerateActaPdfUseCase {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(bajaId: string): Promise<ActaPdfResult> {
    // 1. Cargar la baja con activo y jefe
    const baja = await this.prisma.baja.findUnique({ where: { id: bajaId } });
    if (!baja) {
      throw new NotFoundException(`La baja con ID ${bajaId} no existe.`);
    }

    if (baja.status !== 'APROBADA') {
      throw new NotFoundException(
        `Solo se puede generar el Acta para bajas en estado APROBADA (estado actual: ${baja.status}).`,
      );
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: baja.assetId },
    });

    const jefe = await this.prisma.user.findUnique({
      where: { id: baja.jefeId },
    });

    // 2. Generar el PDF en memoria
    const buffer = await this.buildPdf(baja, asset, jefe);
    const filename = `Acta-Baja-SABS-${baja.id.substring(0, 8).toUpperCase()}.pdf`;

    return { buffer, filename };
  }

  private buildPdf(baja: any, asset: any | null, jefe: any | null): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 60 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 120; // margin * 2

      // ── CABECERA ───────────────────────────────────────────────────────────
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('UNIVERSIDAD MAYOR DE SAN SIMÓN', { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Dirección de Activos Fijos — SCAF', { align: 'center' });

      doc.moveDown(0.5);
      doc
        .moveTo(60, doc.y)
        .lineTo(doc.page.width - 60, doc.y)
        .lineWidth(2)
        .stroke();
      doc.moveDown(0.5);

      // Número de expediente (alineado a la derecha)
      const expediente = `BJ-${baja.id.substring(0, 8).toUpperCase()}`;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`EXPEDIENTE: ${expediente}`, { align: 'right' });

      doc.moveDown(0.5);

      // ── TÍTULO ─────────────────────────────────────────────────────────────
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('ACTA DE BAJA DEFINITIVA Y RETIRO DE BIENES', { align: 'center', underline: true });
      doc.moveDown(1);

      // ── DATOS DE CABECERA ──────────────────────────────────────────────────
      const fechaRetiro = new Date(baja.initiatedAt).toLocaleDateString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      doc.font('Helvetica').fontSize(10);
      const startY = doc.y;
      const half = pageWidth / 2;

      doc
        .font('Helvetica-Bold').text('UNIDAD DE PROCEDENCIA: ', 60, startY, { continued: true })
        .font('Helvetica').text(asset?.location ?? 'No especificado', { width: half });

      doc
        .font('Helvetica-Bold').text('FECHA DE RETIRO: ', 60, doc.y, { continued: true })
        .font('Helvetica').text(fechaRetiro);

      doc
        .font('Helvetica-Bold').text('DOCUMENTO DE RESPALDO: ', 60, doc.y, { continued: true })
        .font('Helvetica').text(baja.evidence);

      doc
        .font('Helvetica-Bold').text('AUTORIZADO POR: ', 60, doc.y, { continued: true })
        .font('Helvetica').text(jefe?.fullName ?? 'Supervisor Autorizado');

      doc.moveDown(1);
      doc
        .moveTo(60, doc.y)
        .lineTo(doc.page.width - 60, doc.y)
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(1);

      // ── PÁRRAFO DE CERTIFICACIÓN ───────────────────────────────────────────
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(
          'La Comisión de Activos Fijos y Control de Bienes de la Universidad Mayor de San Simón ' +
          'certifica que se ha procedido a la desincorporación física e inventariada del siguiente bien, ' +
          'resolviendo su retiro de inventarios activos y disponiendo su destrucción/reciclaje final ' +
          'conforme al reglamento general del SABS:',
          { align: 'justify' },
        );
      doc.moveDown(1);

      // ── TABLA DEL ACTIVO ───────────────────────────────────────────────────
      const tableTop = doc.y;
      const colWidths = [120, 180, 130, 90]; // QR, Descripción, Ubicación, Estado
      const headers = ['CÓDIGO QR / BARRAS', 'DESCRIPCIÓN DEL ACTIVO', 'UBICACIÓN DE RETIRO', 'ESTADO'];
      const rowH = 22;

      // Encabezados de tabla
      let xPos = 60;
      doc.font('Helvetica-Bold').fontSize(8);
      headers.forEach((h, i) => {
        doc
          .rect(xPos, tableTop, colWidths[i], rowH)
          .fillAndStroke('#e0e0e0', '#000000');
        doc
          .fillColor('#000000')
          .text(h, xPos + 4, tableTop + 7, { width: colWidths[i] - 8 });
        xPos += colWidths[i];
      });

      // Fila de datos
      const rowTop = tableTop + rowH;
      xPos = 60;
      const rowData = [
        asset?.qrCode ?? 'S/QR',
        asset?.name ?? 'Activo Desconocido',
        asset?.location ?? 'N/A',
        'RETIRADO (BAJA)',
      ];
      const rowColors = ['#000000', '#000000', '#000000', '#c62828'];

      doc.font('Helvetica').fontSize(9);
      rowData.forEach((val, i) => {
        doc
          .rect(xPos, rowTop, colWidths[i], rowH)
          .stroke('#000000');
        doc
          .fillColor(rowColors[i])
          .text(val, xPos + 4, rowTop + 7, { width: colWidths[i] - 8 });
        xPos += colWidths[i];
      });

      doc.fillColor('#000000');
      doc.y = rowTop + rowH + 10;
      doc.moveDown(1);

      // ── JUSTIFICACIÓN ──────────────────────────────────────────────────────
      doc
        .rect(60, doc.y, pageWidth, 60)
        .stroke('#000000');
      const justY = doc.y + 6;
      doc
        .font('Helvetica-Bold').fontSize(8)
        .text('JUSTIFICACIÓN TÉCNICA DE LA DESINCORPORACIÓN:', 66, justY);
      doc
        .font('Helvetica').fontSize(9)
        .text(`"${baja.justification}"`, 66, justY + 14, {
          width: pageWidth - 12,
          align: 'justify',
        });

      doc.moveDown(5);

      // ── FIRMAS ─────────────────────────────────────────────────────────────
      const sigY = doc.y + 20;
      const sig1X = 90;
      const sig2X = doc.page.width - 90 - 180;

      // Línea firma 1
      doc
        .moveTo(sig1X, sigY)
        .lineTo(sig1X + 180, sigY)
        .stroke();
      doc
        .font('Helvetica-Bold').fontSize(9)
        .text('Responsable de Almacén', sig1X, sigY + 5, { width: 180, align: 'center' });
      doc
        .font('Helvetica').fontSize(8)
        .text('Procesó Conforme', sig1X, sigY + 17, { width: 180, align: 'center' });
      doc
        .text('Dpto. Activos Fijos', sig1X, sigY + 27, { width: 180, align: 'center' });

      // Línea firma 2
      doc
        .moveTo(sig2X, sigY)
        .lineTo(sig2X + 180, sigY)
        .stroke();
      doc
        .font('Helvetica-Bold').fontSize(9)
        .text(jefe?.fullName ?? 'Supervisor Autorizado', sig2X, sigY + 5, { width: 180, align: 'center' });
      doc
        .font('Helvetica').fontSize(8)
        .text('Autorizó Conforme', sig2X, sigY + 17, { width: 180, align: 'center' });
      doc
        .text('Supervisor / Comisión Activos', sig2X, sigY + 27, { width: 180, align: 'center' });

      // ── PIE DE PÁGINA ──────────────────────────────────────────────────────
      doc
        .fontSize(7)
        .fillColor('#888888')
        .text(
          `Generado por SCAF-Activa360 · ${new Date().toLocaleString('es-BO')} · Documento oficial UMSS`,
          60,
          doc.page.height - 40,
          { align: 'center', width: pageWidth },
        );

      doc.end();
    });
  }
}
