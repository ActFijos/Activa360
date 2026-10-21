# Requirements Analysis — PrismaInventoryRecordAdapter

**Generado por:** AI-DLC 2.11.0 (perfil Express)  
**Fecha:** 2026-10-21  
**Feature:** Persistencia de registros de inventario QR en PostgreSQL con control de concurrencia

---

## Contexto del Proyecto (Reverse Engineering)

| Elemento | Valor detectado |
| :---- | :---- |
| Framework | NestJS + TypeScript (ESM — imports con `.js`) |
| ORM | Prisma Client (`@prisma/client`) |
| Base de datos | PostgreSQL |
| Arquitectura | Hexagonal (Ports & Adapters) |
| Puerto de salida | `InventoryRecordRepositoryPort` (ya existente) |
| Modelo Prisma | `InventoryRecord` con `@@unique([campaignId, assetId])` (ya existente en schema.prisma) |
| PrismaService | Compartido desde `compliance` module vía `src/modules/compliance/adapters/out/db/prisma.service.ts` |

---

## Requisitos Funcionales

### RF-01: Registro de escaneo QR
- El sistema debe permitir registrar el escaneo de un activo (`assetId`) dentro de una campaña de inventario (`campaignId`) por parte de un usuario (`userId`).
- La operación debe devolver el `InventoryRecord` persistido en base de datos.

### RF-02: Control de unicidad por campaña
- No pueden existir dos registros con la misma combinación `(campaignId, assetId)`.
- La restricción de unicidad está garantizada a nivel de PostgreSQL mediante `@@unique([campaignId, assetId])` en `schema.prisma`.
- **[Request Changes aplicado]:** El error `P2002` de Prisma (violación de restricción UNIQUE) debe mapearse a `ConflictException` (HTTP 409) con mensaje descriptivo que incluya `assetId` y `campaignId`.

### RF-03: Verificación de existencia
- El sistema debe exponer un método `existsRecord(campaignId, assetId)` que retorne `true` si ya existe un registro para la combinación dada.

---

## Criterio de Aceptación

> **20 solicitudes concurrentes** para el mismo `assetId`/`campaignId` → exactamente **1 registro** en la tabla `inventory_records`.

El control de concurrencia se delega al motor de base de datos PostgreSQL. La restricción `UNIQUE` a nivel de BD garantiza que solo una de las 20 solicitudes tenga éxito; las restantes recibirán `ConflictException (409)`.

---

## Requisitos No Funcionales

- Los imports TypeScript deben usar extensión `.js` (requerimiento ESM del proyecto).
- El adaptador debe ser `@Injectable()` y registrarse en `InventoryModule` como proveedor de `InventoryRecordRepositoryPort`.
- `InventoryRecordRepositoryPort` debe incluirse en los `exports` del módulo para que otros módulos puedan consumirlo.
- No incluir `.env` ni secretos en los commits.

---

## Archivos a Crear / Modificar

| Archivo | Acción |
| :---- | :---- |
| `src/modules/inventory/adapters/out/db/prisma-inventory-record.adapter.ts` | **Crear** |
| `src/modules/inventory/inventory.module.ts` | **Modificar** — agregar proveedor y export |
| `aidlc/requirements.md` | **Crear** (este archivo) |
| `aidlc/code-generation-plan.md` | **Crear** |
| `aidlc/test-results.md` | **Crear** |
| `.aidlc-version` | **Crear** |
