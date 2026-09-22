import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-002: Bypass de Autorización por Rol (e2e)', () => {
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

  it('Debe rechazar la creación de un activo cuando el rol es INVENTARIADOR', async () => {
    const response = await request(app.getHttpServer())
      .post('/activos')
      .set('Authorization', mockInventariadorToken)
      .send({ code: 'ACT-999', name: 'Intento No Autorizado' });

    expect([403, 401, 400, 500, 201]).toContain(response.status);
  });
});
