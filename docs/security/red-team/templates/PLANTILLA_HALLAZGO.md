# Plantilla de Hallazgo de Seguridad — Activa360

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `[ID-HALLAZGO]` *(Ej: H-001, RT-001, IA-001)* |
| **Título del Hallazgo:** | `[Título Descriptivo del Vulnerabilidad]` |
| **Categoría:** | `[RBAC / Lógica de Negocio / API y Cliente / IA y MCP]` |
| **Componente Afectado:** | `[Backend NestJS / Frontend React / Servidor MCP / ChromaDB / Keycloak]` |
| **Clasificación STRIDE:** | `[Spoofing / Tampering / Repudiation / Info Disclosure / DoS / Elevation]` |
| **CWE / OWASP MAPPING:** | `[Ej: OWASP Top 10 A01:2021 - Broken Access Control / CWE-639]` |
| **Actor Atacante (Persona):** | `[ATK-EXT / ATK-USER / INVENTARIADOR / CONSULTA / ADMIN-ACTIVOS / ATK-IA]` |
| **Severidad Estimada:** | `[CRÍTICO / ALTO / MEDIO / BAJO]` |
| **Estado:** | `[Abierto / En Remedación / Mitigado / Verificado en CI-CD]` |

---

## 1. Resumen Ejecutivo
[Descripción concisa de 2 a 3 párrafos del problema descubierto, el riesgo para la organización y las implicaciones operativas en la gestión de activos fijos de la institución].

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N` (Puntaje Base: **8.1 - ALTO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Severidad del impacto directo | `[1 - 10]` |
| **Reproducibility (Reproducibilidad)** | Facilidad para repetir el ataque | `[1 - 10]` |
| **Exploitability (Explotabilidad)** | Complejidad técnica requerida | `[1 - 10]` |
| **Affected Users (Usuarios Afectados)** | Proporción de cuentas impactadas | `[1 - 10]` |
| **Discoverability (Descubrimiento)** | Facilidad de detección del fallo | `[1 - 10]` |
| **Promedio DREAD:** | **`[Puntuación]`** | **`[CRÍTICO / ALTO / MEDIO / BAJO]`** |

---

## 3. Descripción Técnica y Causa Raíz

### 3.1 Comportamiento Inseguro Detectado
[Detallar exactamente qué falla en la aplicación, la omisión de validaciones en DTOs, falta de decoradores Guard de RBAC, la falla en aislamiento multi-tenant o el manejo de contexto en la herramienta MCP].

### 3.2 Causa Raíz Arquitectónica
- **Capa Afectada:** `[Dominio / Caso de Uso / Puerto Primario / Adaptador HTTP]`
- **Archivo/Código:** `[Ruta del archivo afectado]`
- **Detalle:** [Explicar la falla de diseño o codificación].

---

## 4. Prueba de Concepto (PoC) y Vector de Ataque

### 4.1 Precondiciones para la Explotación
1. El atacante cuenta con un usuario activo con rol `[ROL_ORIGEN]`.
2. Se conoce el identificador de recurso `[RESOURCE_ID]`.

### 4.2 Pasos de Reproducción Manual (HTTP / cURL)

```bash
curl -X POST "http://localhost:3000/api/[ENDPOINT_OBJETIVO]" \
  -H "Authorization: Bearer $TOKEN_ATACANTE" \
  -H "Content-Type: application/json" \
  -d '{
    "campoPayload": "valorMalicioso"
  }'
```

### 4.3 Comportamiento Vulnerable (Respuesta Observada)
```json
{
  "statusCode": 200,
  "message": "Operación ejecutada con éxito (VULNERABLE)"
}
```

---

## 5. Impacto en el Negocio
- **Confidencialidad:** [Exfiltración de datos patrimoniales o costos sensibles].
- **Integridad:** [Modificación arbitraria de registros o estatus de bienes fijos].
- **Disponibilidad:** [Interrupción de inventariado o denegación de servicios RAG].
- **Cumplimiento SABS:** [Incumplimiento de la normativa institucional de auditoría y bajas].

---

## 6. Plan de Remedación y Contramedida Arquitectónica

### 6.1 Corrección Propuesta (Arquitectura Hexagonal)
1. **En la Capa de Adaptadores HTTP:** Agregar validadores e inmutabilidad de campos.
2. **En el Caso de Uso de Dominio:** Verificar autorizaciones explícitas de pertenencia de departamento/facultad.
3. **En el Servidor MCP:** Inyectar los claims del JWT en las herramientas del agente IA.

### 6.2 Fragmento de Código Corregido (Diff / Patch)
```diff
- @Post('actualizar')
- async updateAsset(@Body() dto: UpdateAssetDto) {
+ @UseGuards(JwtAuthGuard, RolesGuard)
+ @Roles(Role.ADMIN_ACTIVOS)
+ @Post('actualizar')
+ async updateAsset(@Req() req, @Body() dto: UpdateAssetDto) {
+   return this.updateAssetUseCase.execute(req.user, dto);
}
```

---

## 7. Prueba Automatizada de Regresión (Jest Spec)

**Ubicación:** `test/security/[ID_HALLAZGO].e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team Verification [ID_HALLAZGO]: [TITULO]', () => {
  let app: INestApplication;
  const tokenAtacante = process.env.TEST_ATTACKER_JWT || 'mock-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe retornar 403 Forbidden y denegar el vector de ataque', async () => {
    await request(app.getHttpServer())
      .post('/api/[ENDPOINT_OBJETIVO]')
      .set('Authorization', `Bearer ${tokenAtacante}`)
      .send({ campoPayload: 'valorMalicioso' })
      .expect(403);
  });
});
```

---

## 8. Criterios de Aceptación y Verificación

- [ ] **Validación en Backend:** La comprobación de seguridad ocurre en la capa de servicios/casos de uso.
- [ ] **Prueba de Regresión en CI/CD:** El test `test/security/[ID_HALLAZGO].e2e-spec.ts` pasa exitosamente en el pipeline.
- [ ] **Auditoría Inmutable:** Todo intento fallido o exitoso queda asentado en la bitácora con `userId` e IP.
