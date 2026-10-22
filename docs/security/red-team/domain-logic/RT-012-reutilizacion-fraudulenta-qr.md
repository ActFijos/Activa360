# Ficha Red Team: RT-012 — Reutilización Fraudulenta o Falsificación de Código QR

- **ID del Caso:** `RT-012`
- **Categoría:** Lógica de Negocio / QR Integrity
- **Actor (Atacante):** `INVENTARIADOR` / `ATK-USER`
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`ScanQrController` / Validadores de dominio)

---

## 1. Descripción del Ataque
Un usuario intenta enviar códigos QR falsificados, hashes alterados o vincular un código QR perteneciente a un activo A para validar o suplantar la presencia del activo B durante el inventario físico.

## 2. Precondiciones
- QR `QR-ACTIVO-A` asignado al activo Escritorio.
- Intento de envío vinculando `QR-ACTIVO-A` con `assetId` de una Laptop.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/inventario/scan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "QR-ESCRITORIO-001",
    "targetAssetId": "ACT-LAPTOP-999"
  }'
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request` o `422 Unprocessable Entity`
- **Message:** `"El código QR no corresponde al activo especificado"`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-012-qr-fraud.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-012: Reutilización Fraudulenta de QR', () => {
  let app: INestApplication;
  const token = process.env.TEST_INV_JWT || 'mock-token-inv';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe rechazar la convalidación cuando el QR no coincide con la firma del activo', async () => {
    await request(app.getHttpServer())
      .post('/api/inventario/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrCode: 'QR-MISMATCH-999', targetAssetId: 'ACT-REAL-100' })
      .expect((res) => {
        expect([400, 422]).toContain(res.status);
      });
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Convalidación estricta de firma HMAC o binding único entre `qrCode` y `assetId` en la capa de dominio.
