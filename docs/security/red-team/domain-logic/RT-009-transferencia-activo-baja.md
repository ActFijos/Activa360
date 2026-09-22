# Ficha Red Team: RT-009 — Transferencia de Activo Dado de Baja (Regla de Transición de Estado)

- **ID del Caso:** `RT-009`
- **Categoría:** Lógica de Negocio / Reglas de Dominio
- **Actor (Atacante):** `ADMIN-ACTIVOS` (Usuario autenticado con privilegios)
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS / Dominio Core ([transfer-asset.service.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/inventory/domain/services/transfer-asset.service.ts))

---

## 1. Descripción del Ataque
Incluso si el usuario posee rol administrativo (`ADMIN-ACTIVOS`), intenta ejecutar la transferencia de un activo cuyo estado actual en la base de datos es `BAJA`. El dominio de negocio debe bloquear cualquier movimiento físico o lógico sobre activos dados de baja institucionalmente.

## 2. Precondiciones
- Activo `ACT-9001` registrado previamente con estado `BAJA` en la base de datos.
- Token JWT del administrador `$TOKEN_ADMIN`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/transferencias" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ACT-9001",
    "targetCustodianId": "CUST-009",
    "reason": "Intento de reactivación mediante transferencia"
  }'
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request` o `422 Unprocessable Entity`
- **Body Esperado:**
```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "No se puede transferir un activo que se encuentra en estado BAJA"
}
```

## 4. Prueba Automatizada de Regresión (Jest / Domain Spec)
**Ubicación:** `test/security/rt-009-transferencia-baja.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-009: Transferencia de Activo en Estado BAJA', () => {
  let app: INestApplication;
  const tokenAdmin = process.env.TEST_ADMIN_JWT || 'mock-token-admin';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe rechazar la transferencia con HTTP 422 cuando el activo está en estado BAJA', async () => {
    await request(app.getHttpServer())
      .post('/api/transferencias')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ assetId: 'ACT-DADO-DE-BAJA-001', targetCustodianId: 'CUST-002' })
      .expect((res) => {
        expect([400, 422]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La entidad de Dominio `Asset` convalida las transiciones de estado antes de permitir el movimiento.
- [ ] La restricción está protegida en la capa de Servicio de Dominio Hexagonal, independiente de la capa de API.
