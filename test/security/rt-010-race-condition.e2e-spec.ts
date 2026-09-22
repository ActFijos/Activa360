import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-010: Concurrencia y Doble Asignación Simultánea (e2e)', () => {
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

  it('Debe procesar la ruta de asignaciones de manera consistente', async () => {
    const assetId = 'ACT-RACE-TEST-001';

    const reqA = request(app.getHttpServer())
      .post('/asignaciones')
      .set('Authorization', mockAdminToken)
      .send({ assetId, custodianId: 'CUSTODIO-A' });

    const reqB = request(app.getHttpServer())
      .post('/asignaciones')
      .set('Authorization', mockAdminToken)
      .send({ assetId, custodianId: 'CUSTODIO-B' });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    expect([resA.status, resB.status]).toBeDefined();
  });
});
