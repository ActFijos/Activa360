# Ficha Red Team: RT-007 — Intentar Ejecutar Baja de Activo Sin Rol Autorizado (Bajas SABS)

- **ID del Caso:** `RT-007`
- **Categoría:** Autorización / Compliance Normativo SABS
- **Actor (Atacante):** `INVENTARIADOR` (Usuario operativo sin privilegios de comisión de bajas)
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`ComplianceModule` / [initiate-baja.controller.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/compliance/adapters/in/web/initiate-baja.controller.ts))

---

## 1. Descripción del Ataque
Un usuario autenticado con el rol operativo `INVENTARIADOR` intenta invocar directamente el endpoint de registro/solicitud de baja institucional de un activo fijo, el cual está restringido únicamente a `ADMIN-ACTIVOS` o miembros autorizados de la comisión de bajas según reglamentación SABS.

## 2. Precondiciones
- Token JWT obtenido para un usuario con rol `INVENTARIADOR`.
- Activo en estado `ASIGNADO` (ID: `ACT-1002`).

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/bajas" \
  -H "Authorization: Bearer $TOKEN_INVENTARIADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ACT-1002",
    "reason": "Obsolescencia Técnica",
    "technicalReportUrl": "http://ejemplo.com/informe.pdf"
  }'
```

### Respuesta Esperada
- **Status Code:** `403 Forbidden`
- **Body:**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource"
}
```

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-007-baja-rbac.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-007: Baja no autorizada por INVENTARIADOR', () => {
  let app: INestApplication;
  const tokenInventariador = process.env.TEST_INVENTARIADOR_JWT || 'mock-token-inventariador';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe rechazar la solicitud de baja con HTTP 403 cuando el usuario es INVENTARIADOR', async () => {
    await request(app.getHttpServer())
      .post('/api/bajas')
      .set('Authorization', `Bearer ${tokenInventariador}`)
      .send({ assetId: 'ACT-1002', reason: 'Prueba RT-007' })
      .expect(403);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La iniciación de bajas SABS está protegida con `@Roles('ADMIN-ACTIVOS', 'COMISION-BAJAS')`.
- [ ] De acuerdo a las políticas del proyecto ([AGENTS.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/AGENTS.md#L27)), cualquier modificación sobre el módulo Compliance requiere revisión estricta.
