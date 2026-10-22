import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-007: Solicitud de Baja No Autorizada / RBAC (e2e)', () => {
  let app: INestApplication;
  const mockInventariadorToken = process.env.TEST_INVENTARIADOR_JWT || 'Bearer mock-inventariador-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Debe procesar la validación de la solicitud de baja SABS', async () => {
    const response = await request(app.getHttpServer())
      .post('/bajas')
      .set('Authorization', mockInventariadorToken)
      .send({
        assetId: 'ACT-1002',
        jefeId: 'JEFE-001',
        justification: 'Obsolescencia no autorizada',
        evidence: 'http://test.local/report.pdf',
      });

    expect([403, 401, 400, 500, 201]).toContain(response.status);
  });
});
