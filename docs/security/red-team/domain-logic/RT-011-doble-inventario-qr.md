# Ficha Red Team: RT-011 — Doble Inventario QR Simultáneo

- **ID del Caso:** `RT-011`
- **Categoría:** Lógica de Negocio / Concurrencia QR
- **Actor (Atacante):** `INVENTARIADOR`
- **Nivel de Severidad:** **MEDIO**
- **Componente Afectado:** Backend NestJS ([scan-qr.controller.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/inventory/adapters/in/web/scan-qr.controller.ts))

---

## 1. Descripción del Ataque
Dos inventariadores escanean simultáneamente el mismo código QR durante una jornada de inventario físico y envían dos peticiones `POST /api/inventario/scan` para registrar el hallazgo. El sistema debe evitar duplicar registros en el historial de inventario para la misma sesión/proceso.

## 2. Precondiciones
- Código QR activo `QR-UMSS-001`.
- Sesión de inventario activa `INV-2026-Q3`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/inventario/scan" \
  -H "Authorization: Bearer $TOKEN_INV_1" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR-UMSS-001", "inventoryId":"INV-2026-Q3"}' & \
curl -X POST "http://localhost:3000/api/inventario/scan" \
  -H "Authorization: Bearer $TOKEN_INV_2" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR-UMSS-001", "inventoryId":"INV-2026-Q3"}' &
```

### Respuesta Esperada
- Una petición retorna `200/201` y la otra retorna `409 Conflict` (o actualiza ideficientemente el timestamp sin duplicar la entrada master).

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-011-doble-qr.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-011: Doble Inventario QR Simultáneo', () => {
  let app: INestApplication;
  const token = process.env.TEST_INV_JWT || 'mock-token-inv';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('No debe duplicar registros al escanear simultáneamente el mismo QR', async () => {
    const req1 = request(app.getHttpServer())
      .post('/api/inventario/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrCode: 'QR-TEST-DUPLICADO', inventoryId: 'INV-001' });

    const req2 = request(app.getHttpServer())
      .post('/api/inventario/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrCode: 'QR-TEST-DUPLICADO', inventoryId: 'INV-001' });

    const [res1, res2] = await Promise.all([req1, req2]);
    expect([200, 201, 409]).toContain(res1.status);
    expect([200, 201, 409]).toContain(res2.status);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Constraint único en base de datos para la combinación `(inventoryId, assetId)`.
