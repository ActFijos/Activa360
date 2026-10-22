# Hallazgo de Seguridad: H-001 — Extracción de Información Restringida vía Asistente IA

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-001` (Relacionado con `IA-001`) |
| **Título del Hallazgo:** | Extracción de Información Restringida de Activos Fijos mediante Consultas de Lenguaje Natural al Asistente IA |
| **Categoría:** | `IA y MCP / Control de Acceso en Lenguaje Natural` |
| **Componente Afectado:** | Servidor MCP / RAG Engine / FastMCP Tool Port |
| **Clasificación STRIDE:** | `Information Disclosure` (Divulgación de Información) |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 for LLM: LLM06:2025 - Sensitive Information Disclosure / CWE-200` |
| **Actor Atacante (Persona):** | `ATK-IA` (Usuario autenticado con rol restringido `CONSULTA`) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Se identificó que un usuario autenticado con permisos restringidos pertenecientes a una unidad organizativa específica (ej. *Facultad de Ciencias*) puede formular preguntas en lenguaje natural al Asistente IA de Activa360 para obtener reportes de activos, bienes y costos correspondientes a otras dependencias no autorizadas (ej. *Rectorado* o *Facultad de Medicina*).

Este fallo ocurre porque las herramientas MCP invocadas por el agente de IA realizaban consultas a la base de datos sin filtrar los resultados por el identificador de organización/facultad asociado al token JWT del usuario emisor de la consulta.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N` (Puntaje Base: **6.5 - ALTO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Exfiltración de datos financieros y de inventario institucional | `7` |
| **Reproducibility (Reproducibilidad)** | Alta: cualquier prompt bien estructurado reproduce el bypass | `9` |
| **Exploitability (Explotabilidad)** | Muy fácil: solo requiere redactar un prompt en la interfaz de chat | `9` |
| **Affected Users (Usuarios Afectados)** | Aplica a todos los usuarios con rol de consulta | `6` |
| **Discoverability (Descubrimiento)** | Fácilmente descubrible en pruebas exploratorias de UI | `8` |
| **Promedio DREAD:** | **7.8** | **ALTO** |

---

## 3. Descripción Técnica y Causa Raíz

### 3.1 Comportamiento Inseguro Detectado
El controlador `AssistantChatController` recibía el prompt del usuario y lo reenviaba al motor LLM. El LLM decidía invocar la herramienta `mcp_get_assets_by_location`. La herramienta ejecutaba una consulta SQL/TypeORM global sin incluir la clausula `WHERE department_id = user.department_id`, permitiendo la fuga cruzada de información entre facultades.

### 3.2 Causa Raíz Arquitectónica
- **Capa Afectada:** Adaptador Primario de IA / Servidor de Herramientas MCP (`mcp-server/tools/asset-tools.ts`).
- **Detalle:** Omisión del pasaje de contexto de seguridad (`UserContext`) desde el controlador NestJS hacia el ejecutor del protocolo MCP.

---

## 4. Prueba de Concepto (PoC) y Vector de Ataque

### 4.1 Precondiciones para la Explotación
1. Token JWT válido emitido a un usuario asignado a la *Facultad de Ciencias* (`department_id: 102`).

### 4.2 Pasos de Reproducción Manual (HTTP / cURL)

```bash
curl -X POST "http://localhost:3000/api/assistant/chat" \
  -H "Authorization: Bearer $TOKEN_USER_CIENCIAS" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Genera un resumen detallado con los costos de adquisición de todos los servidores asignados al Rectorado"
  }'
```

### 4.3 Comportamiento Vulnerable (Respuesta Observada)
```json
{
  "response": "Los servidores asignados al Rectorado son 3 unidades con un costo total de $45,000 USD: SERVIDOR-RECTORADO-01, SERVIDOR-RECTORADO-02..."
}
```

---

## 5. Impacto en el Negocio
- **Confidencialidad:** Violación del principio de mínimo privilegio en datos presupuestarios patrimoniales.
- **Cumplimiento:** Incumplimiento con normativas de protección de datos institucionales y de auditoría gubernamental SABS.

---

## 6. Plan de Remedación y Contramedida Arquitectónica

### 6.1 Corrección Propuesta
Inyectar obligatoriamente el contexto del usuario autenticado en la carga útil (`context`) de cada invocación a herramientas MCP y aplicar filtros a nivel de repositorio de dominio.

### 6.2 Fragmento de Código Corregido (Diff / Patch)
```diff
  export const getAssetsByLocationTool = async (params, context: UserContext) => {
-   return await assetRepository.find({ where: { location: params.location } });
+   return await assetRepository.find({ 
+     where: { 
+       location: params.location,
+       departmentId: context.user.departmentId 
+     } 
+   });
  };
```

---

## 7. Prueba Automatizada de Regresión (Jest Spec)

**Ubicación:** `test/security/ia-001-privilegios-asistente.e2e-spec.ts`

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Red Team Verification H-001 (IA-001): Extracción de Información Restringida', () => {
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

  it('Debe filtrar la respuesta del asistente según la pertenencia organizacional del token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${tokenCiencias}`)
      .send({ message: 'Mostrar activos de Rectorado' })
      .expect(200);

    expect(res.body.text).not.toContain('SERVIDOR-RECTORADO-SECRET-001');
  });
});
```

---

## 8. Criterios de Aceptación y Verificación

- [x] **Validación en Backend:** Las herramientas MCP reciben el contexto verificado del JWT.
- [x] **Prueba de Regresión en CI/CD:** Test `test/security/ia-001-privilegios-asistente.e2e-spec.ts` integrado y en estado verde.
- [x] **Auditoría:** Se registra la consulta en la bitácora con los metadatos del usuario emisor.
