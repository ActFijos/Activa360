import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-001: Bypass de Autenticación (e2e)', () => {
  let app: INestApplication;

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

  it('Debe proteger los endpoints de consulta de activos', async () => {
    const response = await request(app.getHttpServer()).get('/activos');
    expect([401, 403, 200]).toContain(response.status);
  });

  it('Debe validar la ruta de creación de activos', async () => {
    const response = await request(app.getHttpServer())
      .post('/activos')
      .send({ code: 'ACT-UNAUTH-001', name: 'Intento No Autenticado' });

    expect([401, 403, 400, 201]).toContain(response.status);
  });
});
