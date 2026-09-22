# Ficha Red Team: [ID_CASO] — [NOMBRE_DEL_CASO]

- **ID del Caso:** `[ID_CASO]`
- **Categoría:** `[RBAC / Lógica de Negocio / API y Cliente / IA y MCP]`
- **Actor (Atacante):** `[ATK-EXT / ATK-USER / INVENTARIADOR / CONSULTA / ADMIN-ACTIVOS / AUDITOR / ATK-IA / ATK-MCP]`
- **Nivel de Severidad:** `[CRÍTICO / ALTO / MEDIO / BAJO / INFO]`
- **Componente Afectado:** `[Backend NestJS / Frontend React / Servidor MCP / Chroma DB / Keycloak / PostgreSQL]`

---

## 1. Descripción del Ataque
[Descripción detallada del objetivo del ataque, el vector utilizado y la regla de seguridad o de negocio que se intenta vulnerar].

## 2. Precondiciones
- Estado del sistema y datos previos necesarios.
- Rol y credenciales/tokens del actor atacante.
- Identificadores de recursos o endpoints objetivo.

## 3. Pruebas Manuales (HTTP Requests / Commands)

### Petición HTTP (cURL)
```bash
curl -X [METODO] "http://localhost:3000/api/[ENDPOINT]" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campo": "valor"
  }'
```

### Respuesta Observada vs. Esperada
- **Status Code Esperado:** `[401 / 403 / 400 / 422]`
- **Cuerpo de Respuesta Esperado:**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Forbidden resource"
}
```

## 4. Prueba Automatizada de Regresión (Jest / Playwright)
**Ubicación:** `test/security/[ID_CASO].spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team [ID_CASO]: [NOMBRE_DEL_CASO]', () => {
  let app: INestApplication;
  const token = process.env.TEST_JWT || 'mock-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe bloquear la operación no autorizada', async () => {
    await request(app.getHttpServer())
      .post('/api/[ENDPOINT]')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] La validación debe realizarse a nivel de backend/dominio (no solo en UI).
- [ ] La prueba automatizada debe incluirse en la suite de seguridad del pipeline CI/CD.
- [ ] El intento de acceso queda registrado en la bitácora de auditoría.
