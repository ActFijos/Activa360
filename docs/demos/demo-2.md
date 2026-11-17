# Demo 2 · release/8.2.0

Release: https://github.com/ActFijos/Activa360/releases/tag/v8.2.0
Notas del release: [`8.2.0-aportes.md`](../../8.2.0-aportes.md)

## 1. Integrantes y funcionalidades

| Integrante | Funcionalidad | Caso de uso FSD | Repositorio |
| :---- | :---- | :---- | :---- |
| Guillermo Omar Daza Alcalá | Inventario QR con control de concurrencia (`POST /inventory/scan`) | FSD-UC-001 – Registro y escaneo de activo QR | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |
| Guillermo Omar Daza Alcalá | Transferencias de activos con bloqueo pesimista `SELECT FOR UPDATE` | FSD-UC-005 – Traspaso de Activo | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |
| Josefina Rojas | Gestión de Activos Fijos Patrimoniales y Control de Estados SABS (`POST /activos`, `GET /activos`, `GET /activos/{id}`, `PATCH /activos/{id}/estado`) | FSD-UC-001 – Registro y Administración de Activos Fijos Patrimoniales | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |
| Josefina Rojas | Diagnóstico Técnico Previo a Baja y Soporte de Restauración Condicional (`POST /activos/{id}/diagnosticos`, `GET /diagnosticos`, `GET /diagnosticos/{id}`) | FSD-UC-003 – Evaluación y Diagnóstico Técnico Previo a Baja SABS | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |
| Rita Nina | Filtros en listado de Bajas SABS (`estado`, `activo`, `fechaDesde`, `fechaHasta`) | FSD-UC-006 – Generación de Acta PDF y Control SABS | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |
| Rita Nina | Paginación configurable en listado de Bajas (`page`, `limit`, `totalPages`) | FSD-UC-006 – Generación de Acta PDF y Control SABS | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |
| Rita Nina | Comentario y justificación obligatoria al rechazar Baja (`POST /bajas/:id/rechazar`) | FSD-UC-006 – Generación de Acta PDF y Control SABS | https://github.com/ActFijos/Activa360/tree/release/8.2.0 |

---

## 2. Detalle de funcionalidades presentadas

### 2.1 Inventario QR — FSD-UC-001

- **Endpoints (OpenAPI):** `POST /inventory/scan`, `GET /activos/qr/{qrCode}`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado un activo registrado en el sistema con código QR
  Cuando el inventariador escanea el código QR con la app
  Entonces el sistema muestra los datos del activo
    Y permite actualizar ubicación y estado
  ```
- **Control de concurrencia:** el modelo `InventoryRecord` tiene la restricción
  `@@unique([campaignId, assetId])`, de modo que un activo no se registra dos
  veces en la misma campaña.

### 2.2 Transferencias concurrentes — FSD-UC-005

- **Endpoints (OpenAPI):** `POST /activos/transferir`, `GET /activos/transferencias`,
  `POST /activos/transferencias/{id}/aprobar`,
  `POST /activos/transferencias/{id}/rechazar`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado un activo asignado al Custodio A
  Cuando Custodio A inicia traspaso a Custodio B
  Entonces Custodio B debe aprobar la recepción
    Y el sistema libera de responsabilidad a Custodio A
  ```
- **Integridad transaccional:** `TransferAssetService` usa `prisma.$transaction()`
  con `SELECT FOR UPDATE` sobre `Asset` para evitar condiciones de carrera.
  La FK `Transfer.assetId → Asset.id` está definida en la migración
  `20261023000001_feat_f2_transfer_fk_asset`.

### 2.3 Módulo Compliance: Bajas SABS (Filtros, Paginación y Rechazo Justificado) — FSD-UC-006

- **Responsable:** Rita Nina (`rita.nina.mpsia@est.umss.edu`)
- **Endpoints (OpenAPI):**
  - `GET /bajas` (parámetros de consulta: `estado`, `activo`, `fechaDesde`, `fechaHasta`, `page`, `limit`).
  - `POST /bajas/{id}/rechazar` (parámetro de ruta `id`, body `RejectBajaDto` con `motivoRechazo`).
- **Feature 1: Filtros en listado de Bajas (`GET /bajas`):**
  - Permite filtrar individualmente o de forma combinada por `estado` (`INICIADA`, `APROBADA`, `RECHAZADA`), por `activo` (búsqueda insensible a mayúsculas por ID, código QR o nombre) y por rango temporal (`fechaDesde` y `fechaHasta`).
  - **Criterio de aceptación (Gherkin):**
    ```gherkin
    Dado un conjunto de trámites de baja en distintos estados y fechas
    Cuando el usuario consulta el endpoint GET /bajas con filtros de estado, activo o rango de fechas
    Entonces el sistema retorna únicamente los trámites que satisfacen simultáneamente todos los criterios
    ```
- **Feature 2: Paginación en `GET /bajas`:**
  - Soporta parámetros `page` (default `1`, mín. `1`) y `limit` (default `10`, mín. `1`, máx. `100`), retornando estructura estandarizada `{ data: Baja[], meta: { total, page, limit, totalPages } }`.
  - **Criterio de aceptación (Gherkin):**
    ```gherkin
    Dado un volumen elevado de registros de baja en la base de datos
    Cuando el cliente solicita una página específica con un límite de registros
    Entonces el sistema responde con el bloque paginado correspondiente y los metadatos de total, página actual y páginas totales
    ```
- **Feature 3: Comentario al rechazar (`POST /bajas/:id/rechazar`):**
  - Exige el campo obligatorio `motivoRechazo` (mínimo 5 caracteres), valida que el trámite exista y esté en estado `INICIADA`, actualiza el estado a `RECHAZADA`, persiste el motivo en base de datos (`Baja.motivoRechazo`), restaura el activo a revisión técnica (`Dañado` u `Obsoleto`) y retorna la entidad actualizada.
  - **Criterio de aceptación (Gherkin):**
    ```gherkin
    Dado un trámite de baja en estado INICIADA
    Cuando el supervisor envía la solicitud de rechazo con un motivo de al menos 5 caracteres
    Entonces la baja cambia su estado a RECHAZADA guardando el motivo de rechazo en base de datos
      Y el activo vinculado restaura su estado a revisión técnica en el inventario
    ```

### 2.4 Gestión de Activos Fijos Patrimoniales y Diagnóstico Técnico Previo a Bajas SABS — FSD-UC-001 & FSD-UC-003

- **Responsable:** Josefina Rojas
- **Feature 1: Gestión de Activos Fijos Patrimoniales y Control de Estados SABS (Mediana / FSD-UC-001):**
  - **Endpoints (OpenAPI):**
    - `POST /activos`: Alta de activo patrimonial con validación de código SABS/QR único, descripción, categoría, fecha de adquisición, valor histórico y estado inicial (`DISPONIBLE` o `ACTIVO`).
    - `GET /activos`: Consulta de bienes patrimoniales con filtros combinados por `estado`, `codigo` y `unidad`.
    - `GET /activos/{id}`: Consulta detallada del activo con trazabilidad histórica completa de cambios de estado e informes asociados.
    - `PATCH /activos/{id}/estado`: Transición controlada de estados normativos SABS (ej. `DISPONIBLE` -> `ASIGNADO` / `EN_MANTENIMIENTO` -> `EN_DIAGNOSTICO` -> `APTO_PARA_BAJA`), bloqueando transiciones no permitidas y protegiendo el estado terminal `Dado_De_Baja`.
  - **Criterios de aceptación (Gherkin):**
    ```gherkin
    Dado un activo fijo registrado en el sistema en estado DISPONIBLE o ACTIVO
    Cuando el responsable solicita el cambio de estado mediante PATCH /activos/{id}/estado con un motivo normativo válido
    Entonces el sistema valida la matriz de transiciones permitidas por normativa SABS
      Y actualiza el estado registrando la trazabilidad histórica en la base de datos
    ```
    ```gherkin
    Dado un bien patrimonial en estado terminal Dado_De_Baja
    Cuando un usuario intenta modificar su estado mediante PATCH /activos/{id}/estado
    Entonces el sistema rechaza la operación con un error de conflicto normativo (409 Conflict) impidiendo la reactivación
    ```
- **Feature 2: Diagnóstico Técnico Previo a Baja y Soporte de Restauración Condicional (Mediana / FSD-UC-003):**
  - **Endpoints (OpenAPI):**
    - `POST /activos/{id}/diagnosticos`: Emisión de informe técnico pericial con número de informe único, causal SABS (*obsolescencia, deterioro irreparable, siniestro, incompatibilidad técnica, hurto/robo*), dictamen de baja, recomendación y evidencia documental. Si dictamina baja, transiciona automáticamente el activo a `APTO_PARA_BAJA` y deja el diagnóstico en estado `VIGENTE` para habilitar `POST /bajas`.
    - `GET /diagnosticos`: Listar diagnósticos técnicos con filtros por `estado` (*VIGENTE, UTILIZADO_EN_BAJA, RESTAURADO, ANULADO*) y por `activo_id`.
    - `GET /diagnosticos/{id}`: Consulta detallada de informe técnico por UUID.
  - **Criterios de aceptación (Gherkin):**
    ```gherkin
    Dado un activo patrimonial en revisión técnica
    Cuando el perito emite un informe mediante POST /activos/{id}/diagnosticos dictaminando baja
    Entonces el informe se registra en estado VIGENTE con número correlativo único
      Y el activo transiciona automáticamente a estado APTO_PARA_BAJA para habilitar el workflow de bajas
    ```
    ```gherkin
    Dado un trámite de baja iniciado que consumió un diagnóstico técnico en estado UTILIZADO_EN_BAJA
    Cuando la baja es rechazada normativamente mediante POST /bajas/{id}/rechazar
    Entonces el sistema restaura condicionalmente el diagnóstico técnico a estado RESTAURADO
      Y restaura el estado del activo a revisión técnica según la causal del informe pericial
    ```

---

## 3. Contrato OpenAPI y flujo de validación

- **Contrato:** [`openapi.json`](../../openapi.json), generado desde los
  decoradores de NestJS (`@nestjs/swagger`). Incluye los endpoints de las
  funcionalidades presentadas con sus esquemas `RegisterAssetDto`, `ChangeAssetStatusDto`, `CreateDiagnosticoDto`, `AssetResponseDto`, `DiagnosticoResponseDto`, `ListBajasQueryDto`, `PaginatedBajasResponseDto` y `RejectBajaDto`.
- **Exportación:** `scripts/export-openapi.ts` (`npm run openapi:export`).
- **CI:** `.github/workflows/openapi-ci.yml` con lint Spectral (`.spectral.yaml`) y control de drift (`git diff --exit-code openapi.json`) con **0 errores y 0 advertencias**.
