# Hallazgo de Seguridad: H-003 — Bypass de Autenticación en Endpoints REST Protegidos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-003` (Relacionado con `RT-001`) |
| **Título del Hallazgo:** | Acceso No Autenticado a Endpoints REST de Gestión Patrimonial por Falta de Decoradores de Autenticación |
| **Categoría:** | `RBAC / Autenticación Perimetral` |
| **Componente Afectado:** | Backend NestJS (`KeycloakAuthGuard` / REST Controllers) |
| **Clasificación STRIDE:** | `Spoofing` (Suplantación) / `Information Disclosure` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A07:2021 - Identification and Authentication Failures / CWE-306` |
| **Actor Atacante (Persona):** | `ATK-EXT` (Atacante externo / Usuario anónimo sin credenciales) |
| **Severidad Estimada:** | **CRÍTICO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Se identificó que un atacante no autenticado puede enviar peticiones HTTP directas a endpoints sensibles del backend (como `/api/activos`), obteniendo acceso a datos patrimoniales o intentando la creación de activos cuando los controladores carecen del guard global de autenticación `KeycloakAuthGuard`.

Este fallo permite la exposición pública del inventario de bienes de la institución a usuarios no autenticados en la red.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` (Puntaje Base: **9.1 - CRÍTICO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Exposición total del catálogo patrimonial y alteración de registros | `10` |
| **Reproducibility (Reproducibilidad)** | Totalmente reproducible mediante cualquier cliente HTTP | `10` |
| **Exploitability (Explotabilidad)** | Inmediata: no requiere tokens ni elevación de privilegios | `10` |
| **Affected Users (Usuarios Afectados)** | Afecta a todo el sistema e institución | `9` |
| **Discoverability (Descubrimiento)** | Muy fácil mediante escaneo de endpoints de la API | `9` |
| **Promedio DREAD:** | **9.6** | **CRÍTICO** |

---

## 3. Descripción Técnica y Causa Raíz

### 3.1 Comportamiento Inseguro Detectado
El controlador `ActivosController` no incluía la anotación `@UseGuards(KeycloakAuthGuard)` a nivel de clase o de método, permitiendo que solicitudes HTTP GET y POST sin el encabezado `Authorization: Bearer <JWT>` fueran procesadas por los casos de uso.

### 3.2 Causa Raíz Arquitectónica
- **Capa Afectada:** Adaptador Primario HTTP (`src/infrastructure/controllers/activos.controller.ts`).
- **Detalle:** Omisión del Guard global o de controlador para la verificación de JWT en NestJS.

---

## 4. Prueba de Concepto (PoC) y Vector de Ataque

### 4.1 Precondiciones para la Explotación
- Ninguna. Atacante en la red local o pública con acceso al puerto de la API (`http://localhost:3000`).

### 4.2 Pasos de Reproducción Manual (HTTP / cURL)

```bash
curl -X GET "http://localhost:3000/api/activos" \
  -H "Accept: application/json"
```

### 4.3 Comportamiento Vulnerable (Respuesta Observada)
```json
[
  {
    "id": "ACT-001",
    "name": "Servidor de Base de Datos Principal",
    "cost": 25000.00
  }
]
```

---

## 5. Impacto en el Negocio
- **Confidencialidad:** Fuga masiva de activos institucionales y ubicaciones físicas.
- **Integridad:** Posible inyección de bienes ficticios o borrado no autorizado por usuarios anónimos.

---

## 6. Plan de Remedación y Contramedida Arquitectónica

### 6.1 Corrección Propuesta
Configurar `KeycloakAuthGuard` como un guard global en `AppModule` o proteger el controlador de forma explícita.

### 6.2 Fragmento de Código Corregido (Diff / Patch)
```diff
+ @UseGuards(KeycloakAuthGuard)
  @Controller('api/activos')
  export class ActivosController {
```

---

## 7. Prueba Automatizada de Regresión (Jest Spec)

**Ubicación:** `test/security/rt-001-bypass-auth.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team Verification H-003 (RT-001): Bypass de Autenticación', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe retornar 401 Unauthorized al consultar GET /api/activos sin token', async () => {
    await request(app.getHttpServer())
      .get('/api/activos')
      .expect(401);
  });
});
```

---

## 8. Criterios de Aceptación y Verificación

- [x] **Validación en Backend:** Todos los controladores REST requieren JWT excepto endpoints explícitamente públicos (`@Public()`).
- [x] **Prueba de Regresión en CI/CD:** Test `rt-001-bypass-auth.e2e-spec.ts` pasando exitosamente.
