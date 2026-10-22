# Informe Técnico Final: Suite de Tests en Tres Capas (Activa360)

---

## 1. Resumen Ejecutivo y Datos del Equipo

### 👥 Información del Equipo
| Campo | Detalle |
| :--- | :--- |
| **Universidad / Programa** | Universidad Mayor de San Simón (UMSS) · Maestría en IA |
| **Módulo** | M6 — Integración de IA en Productos de Software |
| **Docente** | M.Sc. Luis Marcelo Garay Choqueribe |
| **Nombre del Equipo** | Grupo Activos Fijos UMSS / Equipo Activa360 |
| **Integrantes** | • **Josefina Rojas**<br>• **Rita Nina**<br>• **Guillermo Daza Alcalá** |

---

## 10.1 Cobertura de Código

- **Cobertura inicial (Líneas):** `23.95 %`
- **Cobertura final (Líneas):** `42.92 %` *(Servicios de Dominio al 97.94%)*
- **Funciones de dominio sin test antes:** `3` (`TransferAssetService`, `AssignAssetService`, `RegisterAssetService`)
- **Funciones de dominio sin test después:** `0`
- **Módulos/Servicios de dominio sin test antes:** `3`
- **Módulos/Servicios de dominio sin test después:** `0`

| Métrica de Cobertura | Cobertura Inicial | Cobertura Final | Delta / Incremento |
| :--- | :---: | :---: | :---: |
| **Declaraciones (% Stmts)** | 23.82 % | **42.71 %** | **+18.89 %** |
| **Ramas (% Branch)** | 13.33 % | **28.69 %** | **+15.36 %** |
| **Funciones (% Funcs)** | 15.46 % | **30.85 %** | **+15.39 %** |
| **Líneas (% Lines)** | 23.95 % | **42.92 %** | **+18.97 %** |
| **Servicios de Dominio (`domain/services`)** | 44.53 % | **97.94 %** | **+53.41 %** |

---

## 10.2 Tabla de Duplicados Identificados

| Test Evaluado | Se Duplica Con | Criterio de Duplicación | Decisión Auditada |
| :--- | :--- | :--- | :--- |
| `debería iniciar la baja con éxito para un activo Obsoleto` | `debería iniciar la baja con éxito para un activo Dañado` | Misma función bajo prueba (`InitiateBajaService.execute`), mismo flujo feliz, mismo assert de estado `INICIADA`, variando solo el enum de motivo | **Omitir sin eliminar** |

---

## 10.3 Registro de Tests Omitidos

| Nombre del Test | Archivo | Motivo de Omisión | Mecanismo Utilizado |
| :--- | :--- | :--- | :---: |
| `DUPLICADO: debería iniciar la baja con éxito para un activo Obsoleto` | `src/modules/compliance/domain/services/initiate-baja.service.spec.ts` | Evaluado en la prueba anterior con activo `Dañado`. No aporta cobertura adicional al flujo de dominio. | `it.skip(...)` |

> **Nota de Cumplimiento:** Ningún archivo ni función de prueba fue eliminado del repositorio.

---

## 10.4 Matriz de Tests Generados, Aceptados y Descartados

| Capa de Pruebas | Generados por Agente | Aceptados | Descartados / Omitidos | Observaciones y Motivo de Descarte |
| :--- | :---: | :---: | :---: | :--- |
| **Capa 1: Unit** | 25 | **24** | 1 | 1 test duplicado omitido (`it.skip`). Se agregaron pruebas para `TransferAssetService`, `AssignAssetService` y `RegisterAssetService`. |
| **Capa 2: Integración** | 2 | **2** | 0 | Recorrido de flujos reales: (1) Escaneo QR -> Movimiento -> Transferencia y (2) Solicitud de Baja SABS -> Cambio de estado -> Bloqueo duplicados. |
| **Capa 3: Contrato** | 2 | **2** | 0 | Validaciones estructurales con JSON Schema para endpoints `POST /activos/qr` y `POST /bajas`. |
| **TOTAL** | **29** | **28** | **1** | **Suite 100% operativa en 3 capas.** |

---

## 10.5 Esquemas JSON Schema de Endpoints Principales

### A. Endpoint `POST /activos/qr` (Inventario)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "qrCode", "name", "status", "location", "updatedAt"],
  "properties": {
    "id": { "type": "string" },
    "qrCode": { "type": "string" },
    "name": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["Nuevo", "Operativo", "Mantenimiento", "Dañado", "Obsoleto", "Dado_De_Baja", "En_Proceso_Baja", "Asignado"]
    },
    "location": { "type": "string" },
    "updatedAt": { "type": "string" }
  },
  "additionalProperties": false
}
```

### B. Endpoint `POST /bajas` (Compliance SABS)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "assetId", "jefeId", "justification", "evidence", "status", "initiatedAt"],
  "properties": {
    "id": { "type": "string" },
    "assetId": { "type": "string" },
    "jefeId": { "type": "string" },
    "justification": { "type": "string" },
    "evidence": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["Iniciada", "Aprobada", "Rechazada"]
    },
    "initiatedAt": { "type": "string" }
  },
  "additionalProperties": false
}
```

---

## 10.6 Evidencia de la Corrida Final (100% Verde & Offline)

```text
PASS src/modules/compliance/adapters/in/web/initiate-baja.controller.spec.ts
PASS src/modules/inventory/adapters/in/web/scan-qr.controller.spec.ts
PASS src/modules/inventory/adapters/in/web/scan-qr.contract.spec.ts
PASS src/modules/compliance/compliance-flow.integration.spec.ts
PASS src/modules/inventory/inventory-flow.integration.spec.ts
PASS src/modules/inventory/domain/services/register-asset.service.spec.ts
PASS src/modules/compliance/domain/services/initiate-baja.service.spec.ts
PASS src/modules/inventory/domain/services/transfer-asset.service.spec.ts
PASS src/modules/inventory/domain/services/sync-offline.service.spec.ts
PASS src/modules/inventory/domain/services/assign-asset.service.spec.ts
PASS src/modules/inventory/domain/services/scan-qr.service.spec.ts
PASS src/modules/compliance/adapters/in/web/initiate-baja.contract.spec.ts
PASS src/app.controller.spec.ts

Test Suites: 13 passed, 13 total
Tests:       1 skipped, 29 passed, 30 total
Snapshots:   0 total
Time:        9.619 s
Ran all test suites.
```
