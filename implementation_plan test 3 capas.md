# Plan de Implementación: Suite de Tests en Tres Capas (Activa360)

Este plan detalla los pasos para construir, ejecutar y documentar la **Suite de Tests en Tres Capas** (Unit, Integración y Contrato) para el sistema **Activa360**, cumpliendo estrictamente con los criterios especificados en `Actividad – Suite de Tests en Tres Capas.md`.

---

## User Review Required

> [!IMPORTANT]
> - **Omitir sin eliminar:** La actividad prohíbe eliminar archivos de test o pruebas existentes. Las pruebas duplicadas identificadas serán deshabilitadas explícitamente mediante `it.skip(...)` documentando la causa.
> - **Ejecución 100% Offline:** Todas las pruebas de las tres capas utilizarán *test doubles*, mocks de NestJS y esquemas locales para garantizar ejecución en verde sin requerir acceso a red ni LLMs externos.

---

## Open Questions

> [!NOTE]
> No hay preguntas abiertas pendientes. La pila de testing (NestJS TestingModule, Jest, Supertest) y la arquitectura del sistema están completamente identificadas.

---

## Proposed Changes

---

### Capa 1: Pruebas Unitarias (Unit Tests)

#### [MODIFY] [initiate-baja.service.spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/compliance/domain/services/initiate-baja.service.spec.ts)
- Identificar y marcar con `it.skip(...)` el test duplicado de prueba feliz para activo `Obsoleto`, indicando el motivo de la omisión sin eliminar el archivo.

#### [NEW] [transfer-asset.service.spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/inventory/domain/services/transfer-asset.service.spec.ts)
- Crear unit tests para `TransferAssetService`:
  - Transferencia exitosa entre custodios/departamentos.
  - Conflicto si el activo está dado de baja o inactivo.
  - Excepción ante parámetros inválidos.

#### [NEW] [assign-asset.service.spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/inventory/domain/services/assign-asset.service.spec.ts)
- Crear unit tests para `AssignAssetService`:
  - Asignación correcta de un activo no asignado.
  - Conflicto al reasignar un activo previamente asignado sin liberación.

#### [NEW] [register-asset.service.spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/src/modules/inventory/domain/services/register-asset.service.spec.ts)
- Crear unit tests para `RegisterAssetService`:
  - Registro de activo con código QR único.
  - Conflicto por código de activo duplicado.

---

### Capa 2: Pruebas de Integración (Integration Tests)

#### [NEW] [inventory-flow.integration-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/inventory-flow.integration-spec.ts)
- Implementar test de integración para el flujo real de inventario:
  - Invocación desde endpoint `POST /activos/qr` -> `ScanQrService` -> Persistencia del Movimiento.
  - Verificación del camino completo (actualización de estado, coordenadas y registro auditado de movimiento).

#### [NEW] [compliance-flow.integration-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/compliance-flow.integration-spec.ts)
- Implementar test de integración para el flujo real de bajas SABS:
  - Invocación desde `POST /bajas` -> `InitiateBajaService` -> Persistencia de Baja.
  - Verificación de cambio de estado en el activo a `EN_PROCESO_BAJA` y bloqueo de solicitudes duplicadas.

---

### Capa 3: Pruebas de Contrato (Contract Tests)

#### [NEW] [scan-qr.contract-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/scan-qr.contract-spec.ts)
- Implementar test de contrato con `Supertest` para `POST /activos/qr`:
  - Validar payload de respuesta 200 OK contra el JSON Schema de `Asset` (campos requeridos, tipos de datos, catálogo de enums).
  - Validar payload de error 404 Not Found contra la estructura estándar de errores.

#### [NEW] [initiate-baja.contract-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/initiate-baja.contract-spec.ts)
- Implementar test de contrato con `Supertest` para `POST /bajas`:
  - Validar payload de respuesta 201 Created contra el JSON Schema de `Baja`.

---

### Documentación y Reporte Final

#### [NEW] [Informe_Suite_Tests_Tres_Capas_Activa360.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/Informe_Suite_Tests_Tres_Capas_Activa360.md)
- Generar el documento final de entrega consolidado respondiendo al punto 10 de la guía:
  - Cobertura inicial vs final.
  - Tabla de duplicados.
  - Registro de tests omitidos (`skip`).
  - Matriz de auditoría (Generados, Aceptados, Descartados por capa).
  - JSON Schema utilizado para los contratos.
  - Evidencia de la corrida final 100% en verde y offline.

---

## Verification Plan

### Automated Tests
1. **Medición Inicial:** `npm run test:cov` (para capturar la baseline de cobertura).
2. **Ejecución de Unit Tests:** `npm test`
3. **Ejecución de Tests E2E / Integración / Contrato:** `npm run test:e2e` o `npx jest --config ./test/jest-e2e.json`
4. **Medición Final:** `npm run test:cov` (para validar el incremento de cobertura).

### Manual Verification
- Revisar que la consola reporte todas las suites aprobadas en verde y los tests duplicados indicados como `skipped`.
