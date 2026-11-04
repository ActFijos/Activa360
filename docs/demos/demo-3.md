# Demo 3 · release/8.3.0

Release: https://github.com/ActFijos/Activa360/releases/tag/v8.3.0  
Notas del release: [`8.3.0-aportes.md`](../../8.3.0-aportes.md)

## 1. Integrantes y funcionalidades

| Integrante | Funcionalidad | Caso de uso FSD | Repositorio |
| :---- | :---- | :---- | :---- |
| Guillermo Omar Daza Alcalá | Sincronización de datos offline con resolución de conflictos por timestamp (`POST /activos/sync`) | FSD-UC-002 – Sincronización de datos offline | https://github.com/ActFijos/Activa360 |
| Josefina Rojas | Workflow de Baja (SABS) con justificación, evidencia y control de estados (`POST /bajas`, `GET /bajas`, `POST /bajas/{id}/aprobar`, `POST /bajas/{id}/rechazar`) | FSD-UC-003 – Workflow de Baja (SABS) | https://github.com/ActFijos/Activa360 |
| Rita Nina | Asignación de Activos a Custodio con registro y firma digital (`POST /activos/asignar`, `GET /activos/asignaciones`, `GET /activos/empleados`) | FSD-UC-004 – Asignación a Custodio | https://github.com/ActFijos/Activa360 |

---

## 2. Detalle de funcionalidades presentadas

### 2.1 Sincronización de datos offline — FSD-UC-002 (Guillermo Omar Daza Alcalá)

- **Endpoints (OpenAPI):** `POST /activos/sync`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado que el dispositivo recuperó la conectividad
  Cuando el sistema detecta registros pendientes de sincronización
  Entonces envía los datos al servidor en lote
    Y resuelve conflictos priorizando el timestamp más reciente
  ```
- **Integridad y resolución de conflictos:**
  - El servicio `SyncOfflineService` procesa un lote de registros escaneados fuera de línea.
  - **Transaccionalidad previa:** Verifica primero la existencia de todos los códigos QR del lote; si alguno no existe, lanza `NotFoundException` y aborta la operación completa para prevenir inconsistencias parciales.
  - **Algoritmo de resolución (LWW - Last Write Wins):** Compara `itemDate.getTime() > assetDate.getTime()`. Solo si la actualización proveniente del dispositivo móvil es más reciente que la del servidor, se aplican los cambios de ubicación (`latitude`, `longitude`) y de estado en la entidad `Asset`.
  - **Auditoría de movimientos:** Cada sincronización aprobada persiste un registro inmutable en el repositorio `MovementRepositoryPort` mediante la entidad `Movement` con identificador UUID, trazabilidad temporal y coordenadas geoespaciales.

---

### 2.2 Workflow de Baja (SABS) — FSD-UC-003 (Josefina Rojas)

- **Endpoints (OpenAPI):** `POST /bajas`, `GET /bajas`, `POST /bajas/{id}/aprobar`, `POST /bajas/{id}/rechazar`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado un activo en estado "Dañado" u "Obsoleto"
  Cuando el Jefe de Activos inicia el proceso de baja
  Entonces el sistema requiere una justificación y evidencia
    Y cambia el estado del activo a "En Proceso de Baja"
  ```
- **Control normativo de estados y auditoría:**
  - `InitiateBajaService` valida que el activo exista y que el solicitante (`jefeId`) cuente con el rol institucional de Jefe de Activos Fijos.
  - **Justificación y evidencia obligatorias:** Requiere el ingreso explícito de motivos normativos conforme al D.S. 0181 (SABS) y el registro de evidencia documental/fotográfica adjunta.
  - **Transición de estados:** Cambia el estado del activo a `En Proceso de Baja` y crea el registro de baja en estado inicial `EN_REVISION`.
  - **Resolución de la baja:**
    - Al invocar `POST /bajas/{id}/aprobar`, el registro de baja pasa a `APROBADA` y el activo se retira definitivamente del inventario operativo (`Dado_De_Baja`).
    - Al invocar `POST /bajas/{id}/rechazar`, el registro de baja pasa a `RECHAZADA` y el sistema evalúa el diagnóstico técnico previo registrado en `MaintenanceReport` para restaurar con precisión el estado operativo anterior (`Dañado` u `Obsoleto`).

---

### 2.3 Asignación de Activos a Custodio — FSD-UC-004 (Rita Nina)

- **Endpoints (OpenAPI):** `POST /activos/asignar`, `GET /activos/asignaciones`, `GET /activos/empleados`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado un activo sin custodio actual
  Cuando el Jefe asigna el activo a un Funcionario
  Entonces el Funcionario recibe una notificación para aceptar
    Y el sistema registra la firma digital de asignación
  ```
- **Trazabilidad y custodia patrimonial:**
  - `AssignAssetService` formaliza la entrega y custodia de bienes institucionales.
  - Valida la disponibilidad del activo y vincula la responsabilidad directa al funcionario receptor (`responsible`).
  - **Registro de asignación:** Persiste en `AssignmentRecord` el detalle completo del activo asignado (`assetId`), fecha formal (`date`), destino físico (`destination`) y observaciones técnicas/administrativas.
  - **Consulta y nómina:** Permite auditar el histórico total de traspasos y asignaciones mediante `GET /activos/asignaciones`, e integrarse con la nómina de funcionarios mediante `GET /activos/empleados`.

---

## 3. Contrato OpenAPI y flujo de validación

- **Contrato OpenAPI:** [`openapi.json`](../../openapi.json), generado mediante `@nestjs/swagger` y validado contra el esquema de la solución. Incluye las rutas y esquemas de los casos de uso:
  - `/activos/sync`
  - `/bajas`, `/bajas/{id}/aprobar`, `/bajas/{id}/rechazar`
  - `/activos/asignar`, `/activos/asignaciones`, `/activos/empleados`
- **Exportación automatizada:** `scripts/export-openapi.ts` (`npm run openapi:export`).
- **CI & Calidad:** Reglas de validación OpenAPI configuradas en `.github/workflows/openapi-lint.yml` con linter Spectral (`.spectral.yaml`).
