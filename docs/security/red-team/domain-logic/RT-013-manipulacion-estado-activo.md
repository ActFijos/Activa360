# Ficha Red Team: RT-013 — Manipulación Arbitraria del Estado del Activo (State Machine Bypass)

- **ID del Caso:** `RT-013`
- **Categoría:** Lógica de Negocio / Máquina de Estados
- **Actor (Atacante):** `ATK-USER` / `INVENTARIADOR`
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS / Dominio Asset (`AssetStatus` Machine)

---

## 1. Descripción del Ataque
Un usuario intenta forzar un cambio directo de estado (ej. cambiar un activo de `BAJA` o `EN_REPARACION` a `DISPONIBLE` / `ACTIVO`) mediante peticiones `PATCH /api/activos/{id}` sin pasar por los flujos normativos de alta, reingreso o aprobación.

## 2. Precondiciones
- Activo `ACT-7001` actualmente en estado `BAJA`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X PATCH "http://localhost:3000/api/activos/ACT-7001" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DISPONIBLE"
  }'
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request` o `422 Unprocessable Entity`
- **Message:** `"Transición de estado inválida: de BAJA a DISPONIBLE no está permitida"`

## 4. Prueba Automatizada de Regresión (Jest / Domain Spec)
**Ubicación:** `test/security/rt-013-state-machine.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-013: Manipulación Arbitraria de Estado de Activo', () => {
  let app: INestApplication;
  const token = process.env.TEST_USER_JWT || 'mock-token-user';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe rechazar la modificación directa de estado sin seguir la máquina de estados', async () => {
    await request(app.getHttpServer())
      .patch('/api/activos/ACT-EN-BAJA-99')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVO' })
      .expect((res) => {
        expect([400, 422]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La máquina de estados en el Modelo de Dominio `Asset` convalida las salidas y entradas válidas (`ASIGNADO -> EN_REPARACION -> DISPONIBLE`).
