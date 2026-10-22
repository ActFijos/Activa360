# Ficha Red Team: RT-017 — Acceso Directo a la API Bypass Frontend UI

- **ID del Caso:** `RT-017`
- **Categoría:** API y Cliente / Bypass UI
- **Actor (Atacante):** `ATK-USER`
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS REST API

---

## 1. Descripción del Ataque
El atacante omite completamente la interfaz de usuario en React (Vite) y utiliza herramientas HTTP puras (`curl`, Postman, Python) para enviar solicitudes compuestas directamente a la API REST. El objetivo es verificar que la seguridad no dependa de botones desactivados, inputs ocultos o validaciones exclusivamente desarrolladas en el cliente JavaScript.

## 2. Precondiciones
- Instancia activa de la API.
- Token JWT obtenido mediante flujo OAuth2/Keycloak.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/activos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACT-BYPASS-UI",
    "name": "Intento Directo por CLI"
  }'
```

### Respuesta Esperada
- El servidor ejecuta todas las validaciones de negocio, esquemas DTO y permisos RBAC exactamente igual que si la petición hubiera provenido de la interfaz web oficial.

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-017-api-direct-access.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-017: Acceso Directo a API sin Frontend', () => {
  let app: INestApplication;
  const token = process.env.TEST_USER_JWT || 'mock-token-user';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe aplicar todas las reglas de validación en la API ante peticiones HTTP directas', async () => {
    await request(app.getHttpServer())
      .post('/api/activos')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] No existen reglas de validación críticas escritas únicamente en componentes React sin duplicado/enforzamiento en la capa de Backend NestJS.
