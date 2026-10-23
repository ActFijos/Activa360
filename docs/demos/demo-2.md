# Demo 2 · release/8.2.0

Release: https://github.com/ActFijos/Activa360/releases/tag/v8.2.0
Notas del release: [`8.2.0-aportes.md`](../../8.2.0-aportes.md)

## 1. Integrantes y funcionalidades

| Integrante | Funcionalidad | Caso de uso FSD | Repositorio |
| :---- | :---- | :---- | :---- |
| Guillermo Omar Daza Alcalá | Inventario QR con control de concurrencia (`POST /inventory/scan`) | FSD-UC-001 – Registro y escaneo de activo QR | https://github.com/ActFijos/Activa360 |
| Guillermo Omar Daza Alcalá | Transferencias de activos con bloqueo pesimista `SELECT FOR UPDATE` | FSD-UC-005 – Traspaso de Activo | https://github.com/ActFijos/Activa360 |
| Josefina Rojas | Por definir | Por definir | https://github.com/ActFijos/Activa360 |
| Rita Nina | Por definir | Por definir | https://github.com/ActFijos/Activa360 |

> Las funcionalidades de Josefina Rojas y Rita Nina se registrarán aquí cuando
> estén integradas en `main`.

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

## 3. Contrato OpenAPI y flujo de validación

- **Contrato:** [`openapi.json`](../../openapi.json), generado desde los
  decoradores de NestJS (`@nestjs/swagger`). Incluye los endpoints de las
  funcionalidades presentadas.
- **Exportación:** `scripts/export-openapi.ts` (`npm run openapi:export`).
- **CI:** `.github/workflows/openapi-lint.yml` con lint Spectral (`.spectral.yaml`).
