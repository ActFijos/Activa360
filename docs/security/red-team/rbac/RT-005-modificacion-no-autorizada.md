# Ficha Red Team: RT-005 — Modificación No Autorizada de Activo con Rol de Consulta

- **ID del Caso:** `RT-005`
- **Categoría:** Autorización / RBAC
- **Actor (Atacante):** `CONSULTA` (Usuario autenticado con rol de solo lectura/auditoría)
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`UpdateAssetController`)

---

## 1. Descripción del Ataque
Un usuario que posee únicamente permisos de consulta intenta realizar peticiones de actualización (`PUT /api/activos/ACT-1001` o `PATCH /api/activos/ACT-1001`) para alterar datos del activo como su ubicación, valor residual o responsable.

## 2. Precondiciones
- Token JWT asignado al rol `CONSULTA`.
- Activo existente `ACT-1001`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X PUT "http://localhost:3000/api/activos/ACT-1001" \
  -H "Authorization: Bearer $TOKEN_CONSULTA" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nombre Alterado Fraudulentamente",
    "locationId": "LOC-MALICIOUS"
  }'
```

### Respuesta Esperada
- **Status Code:** `403 Forbidden`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-005-modificacion-consulta.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-005: Modificación con Rol CONSULTA', () => {
  let app: INestApplication;
  const tokenConsulta = process.env.TEST_CONSULTA_JWT || 'mock-token-consulta';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe rechazar la modificación del activo con HTTP 403', async () => {
    await request(app.getHttpServer())
      .put('/api/activos/ACT-1001')
      .set('Authorization', `Bearer ${tokenConsulta}`)
      .send({ name: 'Laptop Modificada' })
      .expect(403);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Los métodos `PUT`, `POST`, `DELETE`, `PATCH` requieren explícitamente roles de escritura (`ADMIN-ACTIVOS` o `OPERADOR-INVENTARIO`).
