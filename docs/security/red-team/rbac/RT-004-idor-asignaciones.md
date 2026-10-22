# Ficha Red Team: RT-004 — IDOR en Asignaciones de Activos

- **ID del Caso:** `RT-004`
- **Categoría:** Autorización / RBAC
- **Actor (Atacante):** `ATK-USER` (Usuario autenticado)
- **Nivel de Severidad:** **MEDIO**
- **Componente Afectado:** Backend NestJS (`AssignmentController` / Prisma)

---

## 1. Descripción del Ataque
Un usuario intenta enumerar e inspeccionar actas de asignación pertenecientes a otros funcionarios o dependencias alterando los identificadores de asignación (`GET /api/asignaciones/{id}`).

## 2. Precondiciones
- Token JWT válido para un usuario regular.
- Identificador de asignación perteneciente a otro departamento (ID: `ASIG-8842`).

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X GET "http://localhost:3000/api/asignaciones/ASIG-8842" \
  -H "Authorization: Bearer $TOKEN_REGULAR_USER"
```

### Respuesta Esperada
- **Status Code:** `403 Forbidden` o `404 Not Found`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-004-idor-asignaciones.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-004: IDOR en Asignaciones', () => {
  let app: INestApplication;
  const tokenUser = process.env.TEST_USER_JWT || 'mock-token-user';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe bloquear el acceso a asignaciones ajenas al funcionario autenticado', async () => {
    await request(app.getHttpServer())
      .get('/api/asignaciones/ASIG-AJENA-999')
      .set('Authorization', `Bearer ${tokenUser}`)
      .expect((res) => {
        expect([403, 404]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Convalidar que el funcionario solicitante sea el asignatario o el custodio responsable de la unidad.
