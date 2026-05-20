# Topología de Agentes IA (Activa360)

**Propósito**: Este documento define qué agentes de IA están autorizados a interactuar con este repositorio, sus roles, las herramientas (skills) que pueden utilizar y las restricciones de seguridad (guardrails).

## 1. Declaración de Agentes

| Agente ID | Tipo de Modelo | Rol / Misión | Entorno de Ejecución |
| :---- | :---- | :---- | :---- |
| `cursor-coder` | Claude 3.5 Sonnet | Implementación de código backend y frontend. Escribe casos de uso y tests basándose estrictamente en el FSD. | Cursor IDE |
| `dti-author` | Claude 3.5 Sonnet | Generación y revisión de arquitectura técnica (C4, Markdown, diagramas Mermaid). | Chat CLI / Desktop |

## 2. Mapa de Skills y Reglas Activas

Los agentes están restringidos por los siguientes "skills" documentados y reglas de sistema.

| Skill / Regla | Ubicación | Descripción |
| :---- | :---- | :---- |
| Regla de Backend | `.cursor/rules/activa360.mdc` | Obliga a usar Arquitectura Hexagonal y validar contratos Gherkin. |
| Diagramas C4 | `docs/skills/c4.md` | Estándares para dibujar diagramas Mermaid Nivel 1 a 3. |
| DTI Author | `docs/skills/dti-author.md` | Reglas de frontmatter y validación cruzada para redactar el DTI. |
| POC Runner | `docs/skills/poc-runner.md` | Bootstrapea y ejecuta Pruebas de Concepto (POCs) time-boxed y reproducibles. |
| Caso de Uso Backend | `docs/skills/activa360_backend_skill.md` | Automatiza la implementación de casos de uso NestJS en arquitectura hexagonal. |
| Auditor de Seguridad | `docs/skills/endpoint_security_auditor.md` | Audita controladores y DTOs de NestJS bajo directivas de seguridad. |


## 3. Criterios de Intervención Humana (HIL - Human-In-The-Loop)

Todo agente opera bajo un esquema de "Supervisión Obligatoria":
1. **Generación de Código Crítico**: Cualquier modificación a la lógica del módulo `Compliance` (Bajas SABS) debe ser aprobada explícitamente en el PR por el Líder Técnico.
2. **Consultas a Base de Datos**: Los agentes tienen PROHIBIDO generar consultas SQL crudas o ejecutar scripts de migración automatizados sin *review* manual.

## 4. Trazabilidad AI-SDLC

Para auditar qué artefacto o bloque de código fue generado por qué prompt, referirse al documento:
- `docs/PROMPT_MAPPING.md`
