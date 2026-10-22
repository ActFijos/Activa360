# Ficha Red Team: RT-016 — Alteración o Eliminación Directa de Registros de Auditoría

- **ID del Caso:** `RT-016`
- **Categoría:** Lógica de Negocio / Inmutabilidad de Logs
- **Actor (Atacante):** `ADMIN-ACTIVOS` / `ATK-USER`
- **Nivel de Severidad:** **CRÍTICO**
- **Componente Afectado:** Backend NestJS / Database Schema (`audit_log` Table)

---

## 1. Descripción del Ataque
Un usuario intenta invocar endpoints API no documentados o utilizar permisos administrativos de la aplicación para modificar (`UPDATE audit_log`) o eliminar (`DELETE audit_log`) las trazabilidades de auditoría institucionales grabadas por el sistema.

## 2. Precondiciones
- Registros de auditoría creados previamente en la tabla `app.audit_logs`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X DELETE "http://localhost:3000/api/audit/logs/LOG-1002" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

### Respuesta Esperada
- **Status Code:** `405 Method Not Allowed` o `403 Forbidden`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-016-inmutabilidad-auditoria.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-016: Inmutabilidad de Auditoría', () => {
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

  it('No debe exponer endpoints para DELETE o PUT sobre la bitácora de auditoría', async () => {
    await request(app.getHttpServer())
      .delete('/api/audit/logs/LOG-001')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect((res) => {
        expect([403, 404, 405]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La tabla `audit_logs` no posee controladores de eliminación o modificación en NestJS (Append-Only pattern).
- [ ] Permisos de base de datos restringidos en el usuario de aplicación para evitar `DELETE` o `UPDATE` en esquemas de auditoría.
