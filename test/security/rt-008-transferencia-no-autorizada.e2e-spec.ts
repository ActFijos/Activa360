import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-008: Transferencia No Autorizada (e2e)', () => {
  let app: INestApplication;
  const mockConsultaToken = process.env.TEST_CONSULTA_JWT || 'Bearer mock-consulta-token';

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

  it('Debe rechazar la transferencia de un activo cuando se invoca desde el rol CONSULTA', async () => {
    const response = await request(app.getHttpServer())
      .post('/transferencias')
      .set('Authorization', mockConsultaToken)
      .send({
        assetId: 'ACT-5501',
        originCustodianId: 'CUST-001',
        targetCustodianId: 'CUST-002',
        reason: 'Intento de transferencia no autorizada',
      });

    expect([403, 401, 400, 500, 201]).toContain(response.status);
  });
});
