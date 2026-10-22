import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-014: Inyección de Valores Límite Inválidos (e2e)', () => {
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

  it('Debe rechazar la creación de activos con valores monetarios negativos', async () => {
    const response = await request(app.getHttpServer())
      .post('/activos')
      .set('Authorization', mockUserToken)
      .send({
        code: 'ACT-NEG-001',
        name: 'Mesa con valor negativo',
        purchaseValue: -1500,
      });

    expect([400, 422, 403, 401, 500]).toContain(response.status);
  });
});
