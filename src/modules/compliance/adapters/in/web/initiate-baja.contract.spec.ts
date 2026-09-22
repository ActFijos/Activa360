import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { InitiateBajaController } from './initiate-baja.controller';
import { InitiateBajaUseCase } from '../../../domain/ports/in/initiate-baja.use-case';
import { PrismaService } from '../../out/db/prisma.service';
import { Baja, BajaStatus } from '../../../domain/models/baja.model';

// Definición del JSON Schema para el contrato del endpoint POST /bajas (Sección 5 de la Guía)
const bajaResponseJsonSchema = {
  type: 'object',
  required: ['id', 'assetId', 'jefeId', 'justification', 'evidence', 'status', 'initiatedAt'],
  properties: {
    id: { type: 'string' },
    assetId: { type: 'string' },
    jefeId: { type: 'string' },
    justification: { type: 'string' },
    evidence: { type: 'string' },
    status: {
      type: 'string',
      enum: ['Iniciada', 'Aprobada', 'Rechazada'],
    },
    initiatedAt: { type: 'string' },
  },
};

function validateBajaJsonSchema(data: any, schema: typeof bajaResponseJsonSchema): { valid: boolean; errors: string[] } {
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
  if (typeof data.assetId !== 'string') errors.push('El campo "assetId" debe ser string');
  if (typeof data.jefeId !== 'string') errors.push('El campo "jefeId" debe ser string');
  if (typeof data.justification !== 'string') errors.push('El campo "justification" debe ser string');
  if (!schema.properties.status.enum.includes(data.status)) {
    errors.push(`El estado "${data.status}" no pertenece al catálogo enum permitido`);
  }

  return { valid: errors.length === 0, errors };
}

describe('Test de Contrato: POST /bajas (Capa 3)', () => {
  let app: INestApplication;
  let fakeInitiateBajaUseCase: jest.Mocked<InitiateBajaUseCase>;
  let fakePrismaService: Partial<PrismaService>;

  beforeEach(async () => {
    fakeInitiateBajaUseCase = {
      execute: jest.fn(),
    };
    fakePrismaService = {};

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InitiateBajaController],
      providers: [
        { provide: InitiateBajaUseCase, useValue: fakeInitiateBajaUseCase },
        { provide: PrismaService, useValue: fakePrismaService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('debería responder con HTTP 201 Created y un payload que cumpla strictly con el JSON Schema de Baja', async () => {
    const mockBaja = new Baja(
      'baja-uuid-999',
      'asset-uuid-123',
      'jefe-uuid-456',
      'Daño irreparable por caída en transporte',
      'http://evidencia.org/foto.jpg',
      new Date('2026-09-07T14:30:00.000Z'),
      BajaStatus.INICIADA,
    );
    fakeInitiateBajaUseCase.execute.mockResolvedValue(mockBaja);

    const response = await request(app.getHttpServer())
      .post('/bajas')
      .send({
        assetId: 'asset-uuid-123',
        jefeId: 'jefe-uuid-456',
        justification: 'Daño irreparable por caída en transporte',
        evidence: 'http://evidencia.org/foto.jpg',
      })
      .expect(201);

    // Validación de Contrato Estructural
    const validation = validateBajaJsonSchema(response.body, bajaResponseJsonSchema);
    expect(validation.errors).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(response.body.status).toBe('Iniciada');
  });

  it('debería responder con HTTP 400 Bad Request si faltan campos obligatorios en el DTO', async () => {
    await request(app.getHttpServer())
      .post('/bajas')
      .send({
        assetId: 'asset-uuid-123',
        // Faltan jefeId, justification, evidence
      })
      .expect(400);
  });
});
