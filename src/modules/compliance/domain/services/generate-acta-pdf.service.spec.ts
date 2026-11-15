import { Test, TestingModule } from '@nestjs/testing';
import { GenerateActaPdfService } from './generate-acta-pdf.service.js';
import { PrismaService } from '../../adapters/out/db/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

describe('GenerateActaPdfService (FSD-UC-006)', () => {
  let service: GenerateActaPdfService;
  let prismaMock: {
    baja: { findUnique: jest.Mock };
    asset: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      baja: { findUnique: jest.fn() },
      asset: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateActaPdfService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GenerateActaPdfService>(GenerateActaPdfService);
  });

  it('debería generar el PDF del acta con éxito cuando la baja está APROBADA', async () => {
    prismaMock.baja.findUnique.mockResolvedValue({
      id: 'baja-12345678-uuid',
      assetId: 'asset-1',
      jefeId: 'user-1',
      justification: 'Equipo quemado por fluctuación de voltaje',
      evidence: 'ACTA-2026-001',
      initiatedAt: new Date('2026-05-10T10:00:00Z'),
      status: 'APROBADA',
    });

    prismaMock.asset.findUnique.mockResolvedValue({
      id: 'asset-1',
      name: 'Servidor Dell PowerEdge R740',
      qrCode: 'ACT-UMSS-2026-0001',
      location: 'Centro de Cómputo Central',
      status: 'Dado_De_Baja',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullName: 'Ing. Marco Prado',
      cargo: 'Jefe de Bienes y Servicios',
    });

    const result = await service.execute('baja-12345678-uuid');

    expect(result).toBeDefined();
    expect(result.filename).toBe('Acta-Baja-SABS-BAJA-123.pdf');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(100);
    // Un PDF válido siempre inicia con el header '%PDF'
    const header = result.buffer.subarray(0, 4).toString('utf-8');
    expect(header).toBe('%PDF');
  });

  it('debería lanzar NotFoundException si la baja no existe', async () => {
    prismaMock.baja.findUnique.mockResolvedValue(null);

    await expect(service.execute('baja-inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería lanzar NotFoundException si la baja no tiene estado APROBADA', async () => {
    prismaMock.baja.findUnique.mockResolvedValue({
      id: 'baja-pendiente',
      assetId: 'asset-1',
      jefeId: 'user-1',
      justification: 'Pendiente de revisión',
      evidence: 'DOC-123',
      initiatedAt: new Date(),
      status: 'Iniciada',
    });

    await expect(service.execute('baja-pendiente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
