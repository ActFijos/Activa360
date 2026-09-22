# Ficha Red Team: RT-015 — Manipulación Anómala de Fechas de Adquisición y Ciclo de Vida

- **ID del Caso:** `RT-015`
- **Categoría:** Lógica de Negocio / Validaciones DTO
- **Actor (Atacante):** `ATK-USER`
- **Nivel de Severidad:** **MEDIO**
- **Componente Afectado:** Backend NestJS (`RegisterAssetController` / Dominio Asset)

---

## 1. Descripción del Ataque
Un usuario intenta enviar fechas de adquisición o asignación futuras (ej. `2099-12-31`) o fechas extremadamente antiguas e incompatibles con el ciclo de vida institucional (ej. `1900-01-01`) para vulnerar los cálculos contables o corromper los reportes de depreciación.

## 2. Precondiciones
- Access token válido.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/activos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACT-FECHA-FUTURA",
    "name": "Servidor Cuántico",
    "acquisitionDate": "2099-12-31T00:00:00.000Z"
  }'
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request` o `422 Unprocessable Entity`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-015-manipulacion-fechas.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-015: Manipulación Anómala de Fechas', () => {
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

  it('Debe rechazar fechas de adquisición en el futuro con 400 o 422', async () => {
    await request(app.getHttpServer())
      .post('/api/activos')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'ACT-FECHA', name: 'Test', acquisitionDate: '2099-01-01' })
      .expect((res) => {
        expect([400, 422]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Convalidación mediante `@MaxDate(new Date())` o servicio de dominio que verifique que la fecha no excede el tiempo presente.
