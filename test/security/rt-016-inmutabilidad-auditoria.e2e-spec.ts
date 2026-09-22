import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-016: Inmutabilidad de Registros de Auditoría (e2e)', () => {
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

  it('No debe exponer controladores que permitan eliminar o modificar registros de auditoría', async () => {
    const response = await request(app.getHttpServer())
      .delete('/audit/logs/LOG-999')
      .set('Authorization', mockAdminToken);

    expect([404, 403, 405, 401, 500]).toContain(response.status);
  });
});
