# Ficha Red Team: RT-019 — Carga de Archivos Maliciosos o Inseguros

- **ID del Caso:** `RT-019`
- **Categoría:** API y Cliente / File Upload Security
- **Actor (Atacante):** `ATK-USER`
- **Nivel de Severidad:** **ALTO**
- **Componente Afectado:** Backend NestJS (`FileUploadController` / Multer Storage)

---

## 1. Descripción del Ataque
Subida de archivos adjuntos (fotografías de activos, respaldos de bajas, informes técnicos) con extensiones peligrosas (`.php`, `.exe`, `.html`, `.js`), tipos MIME inconsistentes, o archivos de tamaño desproporcionado (Zip Bomb / DoS de almacenamiento).

## 2. Precondiciones
- Endpoint de carga de archivos `/api/upload` o `/api/bajas/upload-report`.

## 3. Pruebas Manuales (HTTP Requests)

```bash
curl -X POST "http://localhost:3000/api/bajas/upload-report" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@payload_malicioso.php;type=application/x-php"
```

### Respuesta Esperada
- **Status Code:** `400 Bad Request`
- **Message:** `"Tipo de archivo no permitido. Solo se admiten archivos PDF o imágenes (PNG, JPG)"`

## 4. Prueba Automatizada de Regresión (Jest / Supertest)
**Ubicación:** `test/security/rt-019-file-upload.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team RT-019: Carga de Archivos Inseguros', () => {
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

  it('Debe rechazar archivos con extensiones no autorizadas (.php, .exe, .sh)', async () => {
    await request(app.getHttpServer())
      .post('/api/bajas/upload-report')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<?php echo "evil"; ?>'), 'script.php')
      .expect(400);
  });
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] Validación de Magic Bytes (contenido real del archivo) y no solo extensión/header.
- [ ] Límite estricto de tamaño (`limits: { fileSize: 5 * 1024 * 1024 }` / 5MB).
- [ ] Almacenamiento fuera de la raíz web accesible directamente.
