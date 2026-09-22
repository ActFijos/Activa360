# Ficha Red Team: RT-001 — Bypass de Autenticación en API Protegida

- **ID del Caso:** `RT-001`
- **Categoría:** Autenticación / RBAC
- **Actor (Atacante):** `ATK-EXT` (Usuario no autenticado / Externo)
- **Nivel de Severidad:** **CRÍTICO**
- **Componente Afectado:** Backend NestJS (`KeycloakAuthGuard` / Endpoints API REST)

---

## 1. Descripción del Ataque
Un usuario anónimo o atacante externo intenta acceder directamente a endpoints de consulta o modificación de activos fijos (ej. `/api/activos`) omitiendo la cabecera `Authorization: Bearer <token>`. El objetivo es comprobar que ningún endpoint del dominio core entregue información confidencial o permita escrituras sin autenticación válida mediante Keycloak.

## 2. Precondiciones
- Backend NestJS ejecutándose en `http://localhost:3000`.
- Sin token JWT en la petición.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X GET "http://localhost:3000/api/activos" \
  -H "Accept: application/json"
```

### Respuesta Esperada
- **Status Code:** `401 Unauthorized`
- **Body:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-001-bypass-auth.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-001: Bypass de Autenticación', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe retornar 401 Unauthorized al consultar GET /api/activos sin token', async () => {
    await request(app.getHttpServer())
      .get('/api/activos')
      .expect(401);
  });

  it('Debe retornar 401 Unauthorized al intentar crear un activo sin token', async () => {
    await request(app.getHttpServer())
      .post('/api/activos')
      .send({ code: 'ACT-999', name: 'Laptop Insegura' })
      .expect(401);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Todos los controladores del backend (excepto `/api/health` o auth callbacks) están decorados con `@UseGuards(KeycloakAuthGuard)`.
- [ ] No existen endpoints de debug o desarrollo expuestos públicamente sin autenticación.
