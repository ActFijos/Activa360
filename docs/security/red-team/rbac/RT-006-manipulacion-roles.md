# Ficha Red Team: RT-006 — Manipulación Directa de Roles en DTO (Mass Assignment / PrivEsc)

- **ID del Caso:** `RT-006`
- **Categoría:** Autorización / Escalación de Privilegios
- **Actor (Atacante):** `ATK-USER` (Usuario autenticado de cualquier nivel)
- **Nivel de Severidad:** **CRÍTICO**
- **Componente Afectado:** Backend NestJS (`ValidationPipe` / User Profile Controller)

---

## 1. Descripción del Ataque
Un usuario intenta inyectar campos no permitidos en el payload JSON (ej. `"role": "ADMIN"`, `"isSuperUser": true`, `"realmRoles": ["admin"]`) durante la actualización de su perfil o en formularios de registro para elevar sus privilegios en la aplicación (Vulnerabilidad de Asignación Masiva / Mass Assignment).

## 2. Precondiciones
- Endpoint de actualización de perfil `/api/users/me` o `/api/profile`.
- `ValidationPipe` configurado en NestJS.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X PATCH "http://localhost:3000/api/users/me" \
  -H "Authorization: Bearer $TOKEN_USER_REGULAR" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Juan Pérez",
    "roles": ["ADMIN-ACTIVOS", "SUPERUSER"],
    "isAdmin": true
  }'
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request` (o los campos extra deben ignorarse completamente `whitelist: true`).

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-006-mass-assignment.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-006: Mass Assignment y Manipulación de Roles', () => {
  let app: INestApplication;
  const tokenUser = process.env.TEST_USER_JWT || 'mock-token-user';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe rechazar la petición con 400 Bad Request cuando contiene propiedades no permitidas', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({ displayName: 'Juan', roles: ['ADMIN'] })
      .expect(400);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] `ValidationPipe` global activado con `whitelist: true` y `forbidNonWhitelisted: true`.
- [ ] La asignación de roles se realiza exclusivamente desde Keycloak IdP, nunca mediante payloads del cliente REST.
