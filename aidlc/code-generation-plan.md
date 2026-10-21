# Code Generation Plan — PrismaInventoryRecordAdapter

**Generado por:** AI-DLC 2.11.0 (perfil Express)  
**Fecha:** 2026-10-21

---

## Resumen

Implementar el adaptador Prisma que satisface el contrato de `InventoryRecordRepositoryPort` delegando el control de concurrencia a PostgreSQL mediante la restricción `UNIQUE(campaignId, assetId)`.

---

## Paso 1: Crear el Adaptador

**Archivo:** `src/modules/inventory/adapters/out/db/prisma-inventory-record.adapter.ts`

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { InventoryRecordRepositoryPort } from '../../../domain/ports/out/inventory-record-repository.port.js';
import { InventoryRecord } from '../../../domain/models/inventory-record.model.js';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaInventoryRecordAdapter implements InventoryRecordRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async register(campaignId: string, assetId: string, userId: string): Promise<InventoryRecord> {
    try {
      const record = await this.prisma.inventoryRecord.create({
        data: { campaignId, assetId, userId },
      });
      return new InventoryRecord(record.id, record.campaignId, record.assetId, record.userId, record.createdAt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `El activo ${assetId} ya fue registrado en la campaña ${campaignId}.`
        );
      }
      throw error;
    }
  }

  async existsRecord(campaignId: string, assetId: string): Promise<boolean> {
    const count = await this.prisma.inventoryRecord.count({ where: { campaignId, assetId } });
    return count > 0;
  }
}
```

**Decisiones de diseño:**
- El error `P2002` (UNIQUE violation de PostgreSQL) se captura y convierte en `ConflictException` (HTTP 409) con mensaje descriptivo. *[Incorporado tras Request Changes en Requirements Analysis]*
- No se usa `upsert` ni locking optimista. Se delega completamente a la restricción de BD.
- Imports con `.js` para compatibilidad ESM.

---

## Paso 2: Registrar en el Módulo

**Archivo:** `src/modules/inventory/inventory.module.ts`

Agregar en `providers`:
```typescript
{
  provide: InventoryRecordRepositoryPort,
  useClass: PrismaInventoryRecordAdapter,
}
```

Agregar en `exports`:
```typescript
InventoryRecordRepositoryPort,
```

> **Nota:** Ambas acciones son necesarias. Omitir el `export` causaría un error de runtime en módulos que consuman el port.  
> *[Punto aclarado explícitamente durante revisión de esta puerta]*

---

## Paso 3: Verificar Schema Prisma

El modelo `InventoryRecord` ya tiene la restricción correcta. No se requieren cambios en `schema.prisma`:

```prisma
@@unique([campaignId, assetId])
@@map("inventory_records")
```

---

## Archivos impactados

| Archivo | Cambio |
| :---- | :---- |
| `prisma-inventory-record.adapter.ts` | Crear (nuevo) |
| `inventory.module.ts` | Modificar (providers + exports) |
| `schema.prisma` | Sin cambios necesarios |
