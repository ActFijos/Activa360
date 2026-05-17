# Estrategia y Catálogo de Prompt Mapping – Activa360

**Propósito:** Este documento registra y audita las instrucciones (prompts) utilizadas por agentes de Inteligencia Artificial para generar artefactos, código y documentación dentro del proyecto Activa360.

## 1. Catálogo de Artefactos y su Origen

| Artefacto / Documento | Origen | Herramienta / Modelo |
| :--- | :--- | :--- |
| `docs/BRD_Activos_Fijos.md` | Mixto | Humano + Claude 3.5 Sonnet |
| `docs/PRD_Activos_Fijos.md` | Mixto | Humano + Claude 3.5 Sonnet |
| `docs/FSD_Activos_Fijos.md` | Mixto | Humano + Claude 3.5 Sonnet |
| `docs/dti/DOCUMENTO_TECNICO_INICIAL_Activos_Fijos.md` | IA (Generación) | Claude 3.5 Sonnet |
| Código Backend (Ej. `sync.controller.ts`) | IA (Asistido) | Cursor / Claude 3.5 Sonnet |

## 2. Trazabilidad: Requerimiento → Prompt → Artefacto

| Origen (Documento) | ID Requerimiento / UC | ID del Prompt | Consumidor (Agente) | Artefacto Generado |
| :--- | :--- | :--- | :--- | :--- |
| FSD | FSD-UC-001 (Escanear QR) | `PR-UC-001` | `cursor-agent` | `src/modules/inventory/adapters/in/web/sync.controller.ts` |
| FSD | FSD-UC-002 (Sync Offline) | `PR-UC-002` | `cursor-agent` | `src/modules/inventory/domain/services/sync.service.ts` |
| FSD | FSD-UC-003 (Bajas SABS) | `PR-UC-003` | `cursor-agent` | `src/modules/compliance/usecases/baja.usecase.ts` |
| DTI | Diagramas C4 | `PR-DTI-001` | `claude-desktop` | Bloques Mermaid en DTI |

## 3. Anatomía del Prompt Crítico (Ejemplo detallado: PR-UC-001)
*Estructura basaba en los requerimientos de `PROMPT_TEMPLATE.md`*

### 0. Metadatos del prompt
| Campo | Valor |
| :---- | :---- |
| ID del prompt | `PR-UC-001` |
| Título | Generación de Endpoint REST para Escaneo QR |
| Artefacto origen | FSD |
| ID origen | `FSD-UC-001` |
| Tipo de prompt | generación de código |
| Modelo recomendado | Claude 3.5 Sonnet |
| Temperatura | `0.2` |
| Versión | `v0.1` |
| Autor | Equipo Activa360 |

### 1. Anatomía del prompt (contenido principal)
#### 1.1 Role
Eres un Desarrollador Backend Senior experto en NestJS y Arquitectura Hexagonal.

#### 1.2 Task
Implementar el controlador REST (Adaptador de entrada) para procesar un evento de escaneo de código QR proveniente de la app móvil.

#### 1.3 Context
- **Documento fuente**: `docs/FSD_Activos_Fijos.md` (Sección FSD-UC-001)
- **Entradas esperadas**: JSON Payload con `codigo_qr`, `estado_fisico`, `lat_long`, `timestamp`.
- **Restricciones de dominio**: BR-001 (Todo activo debe existir previamente en la base de datos).
- **Restricciones técnicas**: Usar TypeScript estricto, NestJS, retornar respuestas HTTP adecuadas.

#### 1.4 Reasoning
Sigue estos pasos en orden:
1. Crea el DTO de validación usando `class-validator` para asegurar que el payload es seguro.
2. Escribe el método `POST /api/scan` en el controlador manejando las excepciones HTTP si el activo no existe.
3. Inyecta el UseCase correspondiente a través del constructor.

#### 1.5 Stop condition
Detente cuando:
- Hayas escrito el archivo del controlador completo.
- Hayas generado el archivo de pruebas unitarias (`.spec.ts`) basado en los criterios Gherkin del FSD.

#### 1.6 Output
Formato: Bloques de código TypeScript.

### 2. Invariantes del prompt
- La salida **debe** incluir validación estricta de DTOs.
- La salida **no debe** contener credenciales quemadas en el código.
- La salida **debe** citar el ID `<FSD-UC-001>` en un comentario de cabecera en el archivo generado.

### 3. Failure modes declarados
| Código | Descripción | Acción del consumidor |
| :---- | :---- | :---- |
| `E_MISSING_CONTEXT` | La IA no tiene acceso al archivo FSD para leer las reglas. | Abortar y pedir al usuario que adjunte el FSD. |
| `E_POLICY_VIOLATION`| El código intenta evadir la arquitectura hexagonal (ej. consultando BD directo desde el Controller). | Rechazar el código y pedir regeneración. |

## 4. Guardrails y Criterios de Aceptación del Output IA
- **Validación Sintáctica**: El código generado debe pasar el linter de ESLint sin errores (`npm run lint`).
- **Seguridad (Zero PII/Secrets)**: Se prohíbe explícitamente a la IA escribir consultas SQL crudas y exponer datos confidenciales; debe usar un ORM (TypeORM) para evitar SQL Injection.
- **Auditoría Humana**: Todo Pull Request generado por la IA con nivel de riesgo "Medium/High" requiere revisión (Code Review) obligatoria del Líder Técnico humano antes de hacer merge a `main`.

## 5. Política de Versionado y Revisión
Todo cambio en la estructura principal de los prompts críticos (`PR-UC-XXX`) obligará a incrementar la versión semántica en este documento (ej. v0.1 -> v0.2). Además, los lineamientos deben mantenerse sincronizados con las reglas globales de IA ubicadas en `docs/skills/activa360_backend_skill.md`.
