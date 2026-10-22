# Ficha Red Team: RT-014 — Inyección de Valores Límite y Números Inválidos

- **ID del Caso:** `RT-014`
- **Categoría:** Lógica de Negocio / Validaciones DTO
- **Actor (Atacante):** `ATK-USER`
- **Nivel de Severidad:** **MEDIO**
- **Componente Afectado:** Backend NestJS (`class-validator` DTOs)

---

## 1. Descripción del Ataque
Un usuario intenta registrar o actualizar activos introduciendo valores monetarios o cuantitativos extremos o negativos (`"value": -5000`, `"value": 999999999999999999`, `"quantity": -1`) para desbordar los cálculos de depreciación acumulada o alterar el valor neto total institucional.

## 2. Precondiciones
- Access token válido.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/activos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACT-VAL-NEGATIVO",
    "name": "Equipo Test",
    "value": -1500.50,
    "quantity": -5
  }'
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request`
- **Body:**
```json
{
  "statusCode": 400,
  "message": ["value must be a positive number", "quantity must be greater than 0"]
}
```

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-014-valores-invalidos.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-014: Inyección de Valores Límite Inválidos', () => {
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

  it('Debe rechazar valores monetarios negativos o cantidades inválidas con 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/activos')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'ACT-NEGATIVO', name: 'Mesa', value: -100 })
      .expect(400);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] DTOs configurados con `@IsPositive()`, `@Min(1)`, `@Max(10000000)` de `class-validator`.
