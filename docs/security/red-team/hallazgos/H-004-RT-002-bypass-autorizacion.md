# Hallazgo de Seguridad: H-004 — Bypass de Autorización por Rol en Operaciones Críticas

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-004` (Relacionado con `RT-002`) |
| **Título del Hallazgo:** | Invocación de Operaciones de Escritura Patrimonial por Usuarios con Rol de Operador/Inventariador |
| **Categoría:** | `RBAC / Escalación Vertical` |
| **Componente Afectado:** | Backend NestJS (`RolesGuard` / Endpoints de Alta y Edición de Activos) |
| **Clasificación STRIDE:** | `Elevation of Privilege` (Escalada de Privilegios) |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A01:2021 - Broken Access Control / CWE-285` |
| **Actor Atacante (Persona):** | `INVENTARIADOR` / `CONSULTA` (Usuario autenticado con bajo nivel operativo) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Se detectó que un usuario autenticado legítimamente con rol operativo `INVENTARIADOR` o `CONSULTA` puede invocar exitosamente endpoints administrativos reservadas exclusivamente para el rol `ADMIN-ACTIVOS` (tales como la creación directa de activos o actualización de montos contables).

La vulnerabilidad se produce cuando los controladores de NestJS verifican que el token JWT sea válido, pero no aplican el guard de autorización por roles (`RolesGuard`) ni verifican los roles contenidos en los claims del token.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N` (Puntaje Base: **6.5 - ALTO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Creación y modificación arbitraria de activos por personal operativo | `8` |
| **Reproducibility (Reproducibilidad)** | Inmediata para cualquier usuario autenticado | `9` |
| **Exploitability (Explotabilidad)** | Fácil enviando peticiones POST/PUT directas a la API | `8` |
| **Affected Users (Usuarios Afectados)** | Toda la base de datos de activos fijos | `7` |
| **Discoverability (Descubrimiento)** | Alta mediante inspección de llamadas HTTP en cliente web | `8` |
| **Promedio DREAD:** | **8.0** | **ALTO** |

---

## 3. Descripción Técnica y Causa Raíz

### 3.1 Comportamiento Inseguro Detectado
El endpoint `POST /api/activos` aceptaba solicitudes firmadas por usuarios con el rol `INVENTARIADOR`, procesando la inserción de nuevos bienes fijos en el dominio sin verificar la jerarquía de roles.

### 3.2 Causa Raíz Arquitectónica
- **Capa Afectada:** Adaptador de Entrada Controller (`src/infrastructure/controllers/activos.controller.ts`).
- **Detalle:** Ausencia del decorador `@Roles(Role.ADMIN_ACTIVOS)` en combinación con el `RolesGuard`.

---

## 4. Prueba de Concepto (PoC) y Vector de Ataque

### 4.1 Precondiciones para la Explotación
- Token JWT válido de usuario con rol `INVENTARIADOR`.

### 4.2 Pasos de Reproducción Manual (HTTP / cURL)

```bash
curl -X POST "http://localhost:3000/api/activos" \
  -H "Authorization: Bearer $TOKEN_INVENTARIADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACT-1005",
    "name": "Servidor de Alta Gama",
    "value": 15000.00
  }'
```

### 4.3 Comportamiento Vulnerable (Respuesta Observada)
```json
{
  "statusCode": 201,
  "id": "ACT-1005",
  "message": "Activo creado exitosamente"
}
```

---

## 5. Impacto en el Negocio
- **Integridad de Datos:** Alteración no autorizada del catálogo contable por personal de apoyo.
- **Auditoría:** Falta de segregación de funciones exigida por auditorías gubernamentales y financieras.

---

## 6. Plan de Remedación y Contramedida Arquitectónica

### 6.1 Corrección Propuesta
Decorar los métodos de mutación con `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles(Role.ADMIN_ACTIVOS)`.

### 6.2 Fragmento de Código Corregido (Diff / Patch)
```diff
  @Post()
+ @UseGuards(RolesGuard)
+ @Roles(Role.ADMIN_ACTIVOS)
  async crearActivo(@Body() dto: CrearActivoDto) {
```

---

## 7. Prueba Automatizada de Regresión (Jest Spec)

**Ubicación:** `test/security/rt-002-bypass-autorizacion.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team Verification H-004 (RT-002): Bypass de Autorización', () => {
  let app: INestApplication;
  const tokenInventariador = process.env.TEST_INVENTARIADOR_JWT || 'mock-token-inventariador';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Debe retornar 403 Forbidden al intentar crear un activo con rol INVENTARIADOR', async () => {
    await request(app.getHttpServer())
      .post('/api/activos')
      .set('Authorization', `Bearer ${tokenInventariador}`)
      .send({ code: 'ACT-999', name: 'Intento No Autorizado' })
      .expect(403);
  });
});
```

---

## 8. Criterios de Aceptación y Verificación

- [x] **Validación en Backend:** Retorno explícito de `403 Forbidden` ante intentos con roles insuficientes.
- [x] **Prueba de Regresión en CI/CD:** Test `rt-002-bypass-autorizacion.e2e-spec.ts` integrado y verde.
