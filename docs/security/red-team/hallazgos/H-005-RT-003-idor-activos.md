# Hallazgo de Seguridad: H-005 — Referencia Directa No Insegura a Objetos (IDOR) en Consulta de Activos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-005` (Relacionado con `RT-003`) |
| **Título del Hallazgo:** | Acceso no Autorizado a Fichas de Activos de Otras Facultades/Departamentos mediante IDOR |
| **Categoría:** | `RBAC / Control de Acceso Horizontal (IDOR)` |
| **Componente Afectado:** | Backend NestJS (`ActivosQueryUseCase` / Endpoint GET `/api/activos/{id}`) |
| **Clasificación STRIDE:** | `Information Disclosure` (Divulgación de Información) |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A01:2021 - Broken Access Control / CWE-639` |
| **Actor Atacante (Persona):** | `ATK-USER` (Usuario autenticado en la Facultad de Ciencias) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Un usuario autenticado perteneciente a una unidad académica (ej. *Facultad de Ciencias*) puede consultar los detalles y especificaciones técnicas de activos fijos asignados a otras dependencias (ej. *Rectorado* o *Facultad de Derecho*) simplemente modificando el identificador del activo (`id`) en la URL de la API.

Falta un control de acceso basado en atributos (ABAC) a nivel de caso de uso que valide si la facultad del usuario coincide con la facultad propietaria del activo.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` (Puntaje Base: **6.5 - ALTO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Fuga de información patrimonial confidencial entre áreas | `7` |
| **Reproducibility (Reproducibilidad)** | Inmediata cambiando el ID entero o UUID en la URL | `10` |
| **Exploitability (Explotabilidad)** | Trivial enviando solicitudes GET simples | `9` |
| **Affected Users (Usuarios Afectados)** | Toda la información de activos de la institución | `7` |
| **Discoverability (Descubrimiento)** | Altamente descubrible al inspeccionar IDs secuenciales | `9` |
| **Promedio DREAD:** | **8.4** | **ALTO** |

---

## 3. Descripción Técnica y Causa Raíz

### 3.1 Comportamiento Inseguro Detectado
El método `obtenerActivoPorId(id: string)` busca el activo directamente por su Primary Key en PostgreSQL sin incluir el parámetro `departmentId` extraído del token JWT del usuario solicitante.

### 3.2 Causa Raíz Arquitectónica
- **Capa Afectada:** Caso de Uso de Dominio (`src/application/use-cases/obtener-activo.use-case.ts`).
- **Detalle:** Ausencia de validación de pertenencia organizacional (`userContext.departmentId === asset.departmentId`).

---

## 4. Prueba de Concepto (PoC) y Vector de Ataque

### 4.1 Precondiciones para la Explotación
- Token JWT de usuario asignado a la *Facultad de Ciencias* (`departmentId: 102`).
- Identificador de un activo asignado al *Rectorado* (`ACT-RECT-001`).

### 4.2 Pasos de Reproducción Manual (HTTP / cURL)

```bash
curl -X GET "http://localhost:3000/api/activos/ACT-RECT-001" \
  -H "Authorization: Bearer $TOKEN_USER_CIENCIAS"
```

### 4.3 Comportamiento Vulnerable (Respuesta Observada)
```json
{
  "id": "ACT-RECT-001",
  "name": "Servidor Central de Rectorado",
  "departmentId": 101,
  "cost": 45000.00
}
```

---

## 5. Impacto en el Negocio
- **Confidencialidad:** Violación del aislamiento multatenant interno entre dependencias académicas y administrativas.

---

## 6. Plan de Remedación y Contramedida Arquitectónica

### 6.1 Corrección Propuesta
Evaluar los atributos del usuario (`departmentId`) en el Caso de Uso de Dominio antes de devolver la entidad.

### 6.2 Fragmento de Código Corregido (Diff / Patch)
```diff
  async execute(id: string, user: UserClaims): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);
+   if (user.role !== Role.ADMIN_ACTIVOS && asset.departmentId !== user.departmentId) {
+     throw new ForbiddenException('No posee permisos para acceder a activos de otra unidad');
+   }
    return asset;
  }
```

---

## 7. Prueba Automatizada de Regresión (Jest Spec)

**Ubicación:** `test/security/rt-003-idor-activos.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team Verification H-005 (RT-003): IDOR en Activos', () => {
  let app: INestApplication;
  const tokenCiencias = process.env.TEST_CIENCIAS_JWT || 'mock-token-ciencias';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe retornar 403 Forbidden al consultar un activo de otra facultad', async () => {
    await request(app.getHttpServer())
      .get('/api/activos/ACT-RECT-001')
      .set('Authorization', `Bearer ${tokenCiencias}`)
      .expect(403);
  });
});
```

---

## 8. Criterios de Aceptación y Verificación

- [x] **Validación en Dominio:** El servicio de aplicación filtra o rechaza consultas fuera del alcance del departamento del usuario.
- [x] **Prueba de Regresión en CI/CD:** Test `rt-003-idor-activos.e2e-spec.ts` en verde.
