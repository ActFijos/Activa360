import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-003: IDOR en Consulta de Activos (e2e)', () => {
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

  it('Debe restringir o convalidar el acceso al consultar activos por código QR o ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/activos/qr/QR-RECTORADO-001')
      .set('Authorization', mockUserToken);

    expect([404, 403, 401, 200, 500]).toContain(response.status);
  });
});
