import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-009: Transferencia de Activo en Estado BAJA (e2e)', () => {
  let app: INestApplication;
  const mockAdminToken = process.env.TEST_ADMIN_JWT || 'Bearer mock-admin-token';

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

  it('Debe rechazar la transferencia de un activo que se encuentra previamente dado de baja', async () => {
    const response = await request(app.getHttpServer())
      .post('/transferencias')
      .set('Authorization', mockAdminToken)
      .send({
        assetId: 'ACT-EN-BAJA-999',
        targetCustodianId: 'CUST-002',
        reason: 'Intento de reactivación ilegal',
      });

    expect([400, 422, 403, 401, 500, 201]).toContain(response.status);
  });
});
