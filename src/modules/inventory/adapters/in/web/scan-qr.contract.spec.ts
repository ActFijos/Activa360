import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ScanQrController } from './scan-qr.controller';
import { ScanQrUseCase } from '../../../domain/ports/in/scan-qr.use-case';
import { SyncOfflineUseCase } from '../../../domain/ports/in/sync-offline.use-case';
import { Asset, AssetStatus } from '../../../domain/models/asset.model';

// Definición del JSON Schema para el contrato del endpoint POST /activos/qr (Sección 5 de la Guía)
const assetResponseJsonSchema = {
  type: 'object',
  required: ['id', 'qrCode', 'name', 'status', 'location', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    qrCode: { type: 'string' },
    name: { type: 'string' },
    status: {
      type: 'string',
      enum: [
        'Nuevo',
        'Operativo',
        'Mantenimiento',
        'Dañado',
        'Obsoleto',
        'Dado_De_Baja',
        'En_Proceso_Baja',
        'Asignado',
      ],
    },
    location: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

function validateJsonSchema(data: any, schema: typeof assetResponseJsonSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['El cuerpo de la respuesta no es un objeto JSON'] };
  }

  for (const reqField of schema.required) {
    if (!(reqField in data) || data[reqField] === undefined || data[reqField] === null) {
      errors.push(`Campo obligatorio faltante: ${reqField}`);
    }
  }

  if (typeof data.id !== 'string') errors.push('El campo "id" debe ser string');
  if (typeof data.qrCode !== 'string') errors.push('El campo "qrCode" debe ser string');
  if (typeof data.name !== 'string') errors.push('El campo "name" debe ser string');
  if (typeof data.location !== 'string') errors.push('El campo "location" debe ser string');
  if (!schema.properties.status.enum.includes(data.status)) {
    errors.push(`El estado "${data.status}" no pertenece al catálogo enum permitido`);
  }

  return { valid: errors.length === 0, errors };
}

describe('Test de Contrato: POST /activos/qr (Capa 3)', () => {
  let app: INestApplication;
  let fakeScanQrUseCase: jest.Mocked<ScanQrUseCase>;
  let fakeSyncOfflineUseCase: jest.Mocked<SyncOfflineUseCase>;

  beforeEach(async () => {
    fakeScanQrUseCase = {
      execute: jest.fn(),
    };
    fakeSyncOfflineUseCase = {
      execute: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ScanQrController],
      providers: [
        { provide: ScanQrUseCase, useValue: fakeScanQrUseCase },
        { provide: SyncOfflineUseCase, useValue: fakeSyncOfflineUseCase },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('debería responder con HTTP 200 OK y un payload que cumpla estrictamente con el JSON Schema de Asset', async () => {
    const mockAsset = new Asset(
      'uuid-contract-1',
      'QR-CONTRACT-01',
      'Servidor Dell PowerEdge',
      AssetStatus.NUEVO,
      'Lat: -17.39, Long: -66.15',
      new Date('2026-09-07T14:00:00.000Z'),
    );
    fakeScanQrUseCase.execute.mockResolvedValue(mockAsset);

    const response = await request(app.getHttpServer())
      .post('/activos/qr')
      .send({
        qrCode: 'QR-CONTRACT-01',
        latitude: -17.39,
        longitude: -66.15,
      })
      .expect(200);

    // Validación del Contrato Estructural
    const validation = validateJsonSchema(response.body, assetResponseJsonSchema);
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(response.body.status).toBe('Nuevo');
  });

  it('debería responder con HTTP 400 Bad Request si el payload de entrada viola el contrato DTO', async () => {
    await request(app.getHttpServer())
      .post('/activos/qr')
      .send({
        qrCode: '', // Código vacio inválido
      })
      .expect(400);
  });
});
