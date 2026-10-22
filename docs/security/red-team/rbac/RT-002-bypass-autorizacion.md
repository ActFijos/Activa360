# Ficha Red Team: RT-002 — Bypass de Autorización por Rol (Escalación Horizontal/Vertical)

- **ID del Caso:** `RT-002`
- **Categoría:** Autorización / RBAC
- **Actor (Atacante):** `INVENTARIADOR` / `CONSULTA` (Usuario autenticado con privilegios operativos restringidos)
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`RolesGuard` / Controllers del módulo de inventario)

---

## 1. Descripción del Ataque
Un usuario autenticado legítimamente con un rol básico (ej. `INVENTARIADOR`) intenta ejecutar operaciones administrativas de nivel superior (ej. `POST /api/activos` o `DELETE /api/activos/{id}`) para verificar si el backend convalida únicamente la autenticación o si valida adecuadamente el rol requerido (`ADMIN-ACTIVOS`).

## 2. Precondiciones
- Usuario autenticado con rol `INVENTARIADOR`.
- Token JWT válido en `$TOKEN_INVENTARIADOR`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/activos" \
  -H "Authorization: Bearer $TOKEN_INVENTARIADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACT-1005",
    "name": "Servidor de Alta Gama",
    "value": 15000.00
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
**Ubicación:** `test/security/rt-002-bypass-autorizacion.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-002: Bypass de Autorización por Rol', () => {
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

  it('Debe retornar 403 Forbidden al intentar crear un activo con rol INVENTARIADOR', async () => {
    await request(app.getHttpServer())
      .post('/api/activos')
      .set('Authorization', `Bearer ${tokenInventariador}`)
      .send({ code: 'ACT-999', name: 'Intento No Autorizado' })
      .expect(403);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Los endpoints sensibles usan el decorador `@Roles('ADMIN-ACTIVOS')` junto con `RolesGuard`.
- [ ] No se confía en validaciones del lado del cliente (UI ocultando botones).
