# Ficha Red Team: RT-003 — IDOR (Insecure Direct Object Reference) en Consulta de Activos

- **ID del Caso:** `RT-003`
- **Categoría:** Autorización / RBAC
- **Actor (Atacante):** `ATK-USER` (Usuario autenticado con acceso a una unidad organizacional específica)
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`AssetRepository` / `RegisterAssetController`)

---

## 1. Descripción del Ataque
Un usuario pertenecientes a la Unidad A intenta acceder a los detalles completos o datos confidenciales de activos pertenecientes a la Unidad B modificando secuencialmente el parámetro ID en la URL (`GET /api/activos/1001`, `GET /api/activos/1002`).

## 2. Precondiciones
- El usuario `ATK-USER` pertenece únicamente a la Unidad de Humanidades.
- Existen activos pertenecientes a la Unidad de Rectorado (ID: `ACT-9999`).

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X GET "http://localhost:3000/api/activos/ACT-9999" \
  -H "Authorization: Bearer $TOKEN_USER_HUMANIDADES"
```

### Respuesta Esperada
- **Status Code:** `403 Forbidden` (o `404 Not Found` para evitar enumeración)
- **Body:**
```json
{
  "statusCode": 403,
  "message": "No tiene permisos para acceder a activos fuera de su unidad asignada"
}
```

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-003-idor-activos.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-003: IDOR en Consulta de Activos', () => {
  let app: INestApplication;
  const tokenUnitA = process.env.TEST_UNIT_A_JWT || 'mock-token-unita';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe restringir la lectura de un activo de otra unidad organizacional', async () => {
    await request(app.getHttpServer())
      .get('/api/activos/ACT-RECTORADO-001')
      .set('Authorization', `Bearer ${tokenUnitA}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La consulta SQL/Prisma filtra por la unidad del usuario autenticado extraída de su contexto de token JWT.
- [ ] No se confía en el ID enviado libremente por el cliente sin convalidar pertenencia.
