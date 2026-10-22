# Ficha Red Team: RT-008 — Transferencia No Autorizada entre Custodios

- **ID del Caso:** `RT-008`
- **Categoría:** Autorización / RBAC
- **Actor (Atacante):** `CONSULTA` (Usuario autenticado con rol de lectura)
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`TransferAssetController` / [transfer-asset.controller.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/inventory/adapters/in/web/transfer-asset.controller.ts))

---

## 1. Descripción del Ataque
Un usuario no autorizado o con permisos limitados intenta ejecutar la transferencia de custodia de un activo fijo desde un funcionario Origen hacia un funcionario Destino invocando `POST /api/transferencias`.

## 2. Precondiciones
- Activo `ACT-5501` actualmente asignado al Funcionario A.
- Token JWT del atacante con rol `CONSULTA`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/transferencias" \
  -H "Authorization: Bearer $TOKEN_CONSULTA" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ACT-5501",
    "originCustodianId": "CUST-001",
    "targetCustodianId": "CUST-002",
    "reason": "Transferencia Forzada Maliciosa"
  }'
```

### Respuesta Esperada
- **Status Code:** `403 Forbidden`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-008-transferencia-no-autorizada.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-008: Transferencia No Autorizada', () => {
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

  it('Debe retornar 403 Forbidden al intentar ejecutar una transferencia sin rol adecuado', async () => {
    await request(app.getHttpServer())
      .post('/api/transferencias')
      .set('Authorization', `Bearer ${tokenConsulta}`)
      .send({ assetId: 'ACT-5501', targetCustodianId: 'CUST-002' })
      .expect(403);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La transferencia requiere rol `ADMIN-ACTIVOS` o `CUSTODIO-ORIGEN`.
- [ ] Toda transferencia genera un registro inmutable en el historial de movimientos de inventario.
