import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-013: Manipulación Arbitraria de Estado de Activo (e2e)', () => {
  let app: INestApplication;
  const mockUserToken = process.env.TEST_USER_JWT || 'Bearer mock-user-token';

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

  it('Debe rechazar la manipulación directa de estado fuera del flujo permitido por el dominio', async () => {
    const response = await request(app.getHttpServer())
      .patch('/activos/ACT-1001')
      .set('Authorization', mockUserToken)
      .send({ status: 'ACTIVO_RENOVADO' });

    expect([400, 422, 404, 403, 401, 500]).toContain(response.status);
  });
});
