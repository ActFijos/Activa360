# Ficha Red Team: RT-010 — Doble Asignación Simultánea (Race Condition / Integridad DB)

- **ID del Caso:** `RT-010`
- **Categoría:** Lógica de Negocio / Concurrencia
- **Actor (Atacante):** `ADMIN-ACTIVOS`
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS / PostgreSQL Prisma Transactions

---

## 1. Descripción del Ataque
Enviar dos solicitudes HTTP POST concurrentes para asignar exactamente el mismo activo `ACT-001` a dos funcionarios diferentes al mismo tiempo (`FUNCIONARIO-A` y `FUNCIONARIO-B`), con el objetivo de provocar un estado inconsistente de doble asignación (Race Condition).

## 2. Precondiciones
- Activo `ACT-001` actualmente sin asignación previa.
- Herramienta para ráfaga HTTP concurrente (`Promise.all` o `wrk`/`ab`).

## 3. Pruebas Manuales (Script HTTP Concurrente)

```bash
# Ejemplo conceptual con llamadas concurrentes en paralelo
curl -X POST "http://localhost:3000/api/asignaciones" -H "Authorization: Bearer $TOKEN" -d '{"assetId":"ACT-001","custodianId":"CUST-A"}' & \
curl -X POST "http://localhost:3000/api/asignaciones" -H "Authorization: Bearer $TOKEN" -d '{"assetId":"ACT-001","custodianId":"CUST-B"}' &
```

### Respuesta Esperada
- Exactamente una petición retorna `201 Created` y la otra retorna `409 Conflict` o `422 Unprocessable Entity`.
- El activo queda asignado a un único custodio en la base de datos.

## 4. Prueba Automatizada de Regresión (Jest / Parallel Promises)
**Ubicación:** `test/security/rt-010-race-condition.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-010: Doble Asignación Simultánea (Race Condition)', () => {
  let app: INestApplication;
  const token = process.env.TEST_ADMIN_JWT || 'mock-token-admin';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe garantizar que sólo una asignación concurrente tenga éxito', async () => {
    const reqA = request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ assetId: 'ACT-RACECOND-001', custodianId: 'CUST-A' });

    const reqB = request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ assetId: 'ACT-RACECOND-001', custodianId: 'CUST-B' });

    const [resA, resB] = await Promise.all([reqA, reqB]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses.some((s) => [409, 422, 400].includes(s))).toBe(true);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La operación se ejecuta dentro de una transacción Serializable o con Bloqueo Pesimista (`SELECT FOR UPDATE`) en PostgreSQL Prisma.
- [ ] Índice único de integridad en DB sobre activos asignados activos.
