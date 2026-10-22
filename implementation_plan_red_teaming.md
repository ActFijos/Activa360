# Plan de Implementación — Suite de Red Team (docs/security/red-team/)

Crear la estructura modular de documentación y pruebas automatizadas de seguridad en `docs/security/red-team/`, desglosando los 24 casos de prueba de [Red Teaming.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/Red%20Teaming.md) (`RT-001` a `RT-020` e `IA-001` a `IA-004`) en fichas individuales con comandos cURL, payloads de prueba, resultados esperados y tests automatizados en Jest/Playwright.

---

## Proposed Changes

### Documentation & Red Team Suite (`docs/security/red-team/`)

#### [NEW] [README.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/docs/security/red-team/README.md)
* Índice maestro y matriz de trazabilidad de los 24 casos de Red Team, con estados, severidades, actores y enlaces a cada ficha.

#### [NEW] [FICHA_RED_TEAM_TEMPLATE.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/docs/security/red-team/templates/FICHA_RED_TEAM_TEMPLATE.md)
* Plantilla base reutilizable para documentación estandarizada de casos de prueba de seguridad.

#### [NEW] Fichas RBAC y Control de Acceso (`docs/security/red-team/rbac/`)
- `RT-001-bypass-autenticacion.md`
- `RT-002-bypass-autorizacion.md`
- `RT-003-idor-activos.md`
- `RT-004-idor-asignaciones.md`
- `RT-005-modificacion-no-autorizada.md`
- `RT-006-manipulacion-roles.md`
- `RT-007-baja-no-autorizada.md`
- `RT-008-transferencia-no-autorizada.md`

#### [NEW] Fichas Lógica de Negocio y Dominio (`docs/security/red-team/domain-logic/`)
- `RT-009-transferencia-activo-baja.md`
- `RT-010-doble-asignacion.md`
- `RT-011-doble-inventario-qr.md`
- `RT-012-reutilizacion-fraudulenta-qr.md`
- `RT-013-manipulacion-estado-activo.md`
- `RT-014-valores-invalidos.md`
- `RT-015-manipulacion-fechas.md`
- `RT-016-alteracion-auditoria.md`

#### [NEW] Fichas API, Frontend e Inyecciones (`docs/security/red-team/client-and-api/`)
- `RT-017-acceso-directo-api.md`
- `RT-018-inyeccion-sql-xss.md`
- `RT-019-carga-archivos.md`

#### [NEW] Fichas Seguridad IA, RAG y MCP (`docs/security/red-team/ai-and-mcp/`)
- `RT-020-prompt-injection-directo.md`
- `IA-001-extraccion-informacion-restringida.md`
- `IA-002-manipulacion-herramientas-mcp.md`
- `IA-003-prompt-injection-indirecto-rag.md`
- `IA-004-exfiltracion-mediante-rag.md`

---

## Verification Plan

### Automated Verification
- Verificar sintaxis y enlaces de los archivos markdown creados.
- Confirmar que la matriz maestra en `README.md` mapea exitosamente los 24 casos documentados.

### Manual Verification
- Revisar la legibilidad y completitud de las fichas para asegurar que cada una contenga precondiciones, cURL de ataque, respuesta esperada y el snippet de test en Jest/Playwright.
