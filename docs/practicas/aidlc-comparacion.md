# Práctica: AI-DLC de AWS con y sin herramienta

> Copien este archivo en su repositorio como `docs/practicas/aidlc-comparacion.md` y complétenlo. Entreguen por Classroom el enlace al repositorio (y el del video, si eligieron esa opción).

## 1\. Datos

- **Modalidad:** individual  
- **Repositorio:** https://github.com/ActFijos/Activa360  
- **Rama sin herramienta (A):** [`feature-sin-aidlc`](https://github.com/ActFijos/Activa360/tree/feature-sin-aidlc)  
- **Rama con herramienta (B):** [`feature-con-aidlc`](https://github.com/ActFijos/Activa360/tree/feature-con-aidlc)  
- **AI-DLC versión:** `aidlc 2.11.0 (runtime 2.11.0)`  
- **Video (opcional):**

**Responsables** (obligatorio si es en grupo; cada aporte debe verse en los commits con la identidad de su autor):

| Integrante | Qué hizo | Commits o PR |
| :---- | :---- | :---- |
| _(individual)_ | Implementación completa de ambas versiones del adaptador | — |

## 2\. El feature

**Nombre:** `PrismaInventoryRecordAdapter` — Persistencia de registros de inventario QR en PostgreSQL  
**Issue relacionado:** [#1 — Inventario QR con control de concurrencia](https://github.com/ActFijos/Activa360/issues/1)

**Qué hace:** Reemplaza `InMemoryMovementRepository` (array en memoria) por un adaptador Prisma que persiste los registros de inventario QR en PostgreSQL con una restricción `UNIQUE(campaignId, assetId)`, garantizando que dos escaneos concurrentes del mismo activo en la misma campaña no generen duplicados.

- **Entradas:** `campaignId: string`, `assetId: string`, `userId: string`  
- **Salidas:** `InventoryRecord` persistido en BD, o excepción controlada  
- **Errores esperados:** `409 Conflict` cuando ya existe el registro (error Prisma `P2002`)  
- **Criterio de aceptación:** 20 solicitudes concurrentes para el mismo activo/campaña → exactamente 1 registro en BD

### Contexto arquitectónico

El proyecto usa **Arquitectura Hexagonal (Ports & Adapters)** con NestJS + TypeScript + Prisma ORM + PostgreSQL.

El puerto de salida ya existía definido en:
`src/modules/inventory/domain/ports/out/inventory-record-repository.port.ts`

```typescript
export abstract class InventoryRecordRepositoryPort {
  abstract register(campaignId: string, assetId: string, userId: string): Promise<InventoryRecord>;
  abstract existsRecord(campaignId: string, assetId: string): Promise<boolean>;
}
```

El modelo Prisma ya existía en `schema.prisma`:
```prisma
model InventoryRecord {
  id         String            @id @default(uuid())
  campaignId String
  assetId    String
  userId     String
  createdAt  DateTime          @default(now())
  campaign   InventoryCampaign @relation(fields: [campaignId], references: [id])

  @@unique([campaignId, assetId])
  @@map("inventory_records")
}
```

---

## 3\. Versión A: sin la herramienta

### Cómo se trabajó

Se usó el asistente de IA de forma **conversacional directa** (sin AI-DLC), con prompts ad-hoc al modelo para guiar la implementación paso a paso.

**Flujo seguido:**
1. Se le describió el requerimiento al modelo en linguaje natural.
2. El modelo generó el código del adaptador directamente.
3. Se revisó el código manualmente y se aplicaron correcciones de integración (imports, registro en el módulo).
4. Se ejecutaron las pruebas a mano para verificar.

### Artefactos generados (rama A)

| Archivo | Acción |
| :---- | :---- |
| `src/modules/inventory/adapters/out/db/prisma-inventory-record.adapter.ts` | **Creado** — Implementa `InventoryRecordRepositoryPort` usando `PrismaService` |
| `src/modules/inventory/inventory.module.ts` | **Modificado** — Se registra `PrismaInventoryRecordAdapter` como proveedor de `InventoryRecordRepositoryPort` |

### Código generado (Versión A)

```typescript
// prisma-inventory-record.adapter.ts
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
      const record = await this.prisma.inventoryRecord.create({ data: { campaignId, assetId, userId } });
      return new InventoryRecord(record.id, record.campaignId, record.assetId, record.userId, record.createdAt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`El activo ${assetId} ya fue registrado en la campaña ${campaignId}.`);
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

### Resultado

- **Enlace a la rama:** [`feature-sin-aidlc`](https://github.com/ActFijos/Activa360/tree/feature-sin-aidlc)
- El código funciona, las pruebas unitarias pasan.
- **Tiempo estimado:** ~45 minutos (prompts + revisión manual + ajuste de imports + registro en módulo).
- **Intervenciones manuales:** 3 correcciones principales:
  1. El modelo olvidó los `.js` en los imports (requerido por la config de ESM del proyecto).
  2. El modelo no actualizó `inventory.module.ts` para registrar el nuevo adaptador.
  3. El modelo no incluyó `InventoryRecordRepositoryPort` en los `exports` del módulo.

---

## 4\. Versión B: con AI-DLC de AWS 2.11.0 (perfil Express)

### Comando usado

```bash
/aidlc express --feature "PrismaInventoryRecordAdapter — Persistencia de registros de inventario QR en PostgreSQL con control de concurrencia UNIQUE(campaignId, assetId)" --context "NestJS, Hexagonal Architecture, Prisma ORM, PostgreSQL. El puerto InventoryRecordRepositoryPort ya existe. El modelo InventoryRecord ya está en schema.prisma con @@unique([campaignId, assetId]). Capturar error Prisma P2002 y lanzar ConflictException 409."
```

### Salida de `aidlc version`

```
aidlc 2.11.0 (runtime 2.11.0)
```

### Puertas revisadas (Gates)

| Puerta | Estado inicial | Acción tomada (Request Changes) |
| :---- | :---- | :---- |
| **Reverse Engineering** | ✅ Aprobada sin cambios | AI-DLC detectó correctamente el puerto existente, el schema Prisma y los imports ESM requeridos |
| **Requirements Analysis** | ⚠️ Parcial | Se solicitó Request Changes: especificar explícitamente que el error `P2002` debe mapear a `ConflictException` con mensaje descriptivo (campaignId + assetId) |
| **Code Generation** | ✅ Aprobada con ajuste menor | El plan era correcto. Solo se aclaró que el adaptador debe agregarse a `providers` Y a `exports` de `inventory.module.ts` |
| **Build and Test** | ✅ Aprobada | Tests pasaron al primer intento. AI-DLC generó el registro correcto en el módulo sin intervención adicional |

### Artefactos versionados en rama B

```
aidlc/
  spaces/
    default/
      memory/
.aidlc-version
```

Archivos de auditoría generados por AI-DLC:
- `aidlc/requirements.md` — Requisitos analizados (incluye criterio de 20 solicitudes concurrentes → 1 registro)
- `aidlc/code-generation-plan.md` — Plan de generación con archivos a crear/modificar
- `aidlc/test-results.md` — Resultado de la suite de pruebas
- `.aidlc-version` — Versión del runtime utilizado

### Resultado

- **Enlace a la rama:** [`feature-con-aidlc`](https://github.com/ActFijos/Activa360/tree/feature-con-aidlc)
- **Tiempo estimado:** ~25 minutos (incluyendo revisión de puertas).
- **Intervenciones manuales:** 1 Request Changes en la puerta de Requirements Analysis.

---

## 5\. Comparación

| Aspecto | A · sin herramienta | B · con AI-DLC de AWS |
| :---- | :---- | :---- |
| **Tiempo total** | ~45 minutos | ~25 minutos |
| **Veces que tuvieron que intervenir o corregir** | 3 correcciones post-generación (imports ESM, registro en módulo, exports) | 1 Request Changes en puerta de Requirements Analysis |
| **Artefactos que quedaron en el repositorio** | Solo el código fuente (`adapter.ts` + módulo actualizado) | Código fuente + `aidlc/requirements.md` + `aidlc/code-generation-plan.md` + `aidlc/test-results.md` + `.aidlc-version` |
| **¿Las pruebas pasan? (ejecutadas por ustedes)** | ✅ Sí, tras las 3 correcciones manuales | ✅ Sí, al primer intento |
| **Qué salió mejor** | Libertad total para explorar sin estructura fija; iteración rápida al inicio | Detección automática del contexto (imports ESM, registro en módulo); auditoría trazable; menos errores de integración |
| **Qué salió peor** | El modelo olvidó aspectos de integración propios del proyecto; sin trazabilidad de decisiones | El perfil Express no solicitó casos de prueba de concurrencia explícitos; hay que conocer bien las puertas para hacer un buen Request Changes |

---

## 6\. Conclusiones

1. **¿Qué decisiones tomó el agente sin que ustedes las vieran en cada versión?**

   - **Versión A (sin herramienta):** El modelo decidió autónomamente no actualizar `inventory.module.ts`, no agregar los `.js` en los imports y no incluir el adaptador en los `exports`. Estas decisiones "invisibles" generaron 3 ciclos de corrección posteriores.
   - **Versión B (con AI-DLC):** AI-DLC tomó internamente la decisión de incluir la actualización del módulo como parte del plan de generación. Esta decisión fue visible en `code-generation-plan.md` antes de generar el código, lo que permitió validarla.

2. **¿Cuántas veces aprobaron una puerta por inercia, sin revisarla de verdad?**

   La puerta de **Code Generation** estuvo cerca de ser aprobada por inercia: el plan listaba los archivos correctos y se tendía a confiar en eso. Sin embargo, al revisar el detalle se detectó que no mencionaba explícitamente que `InventoryRecordRepositoryPort` debía incluirse en `exports`. Se solicitó aclaración en el plan antes de generar. Si no se hubiera revisado con atención, esto habría causado un error de runtime en otros módulos que consumen el port.

3. **¿Qué evidencia permite a otra persona entender por qué se hizo así: la auditoría de AI-DLC o el historial del PR?**

   La **auditoría de AI-DLC** (`requirements.md`, `code-generation-plan.md`) es más útil para entender *por qué* se tomaron las decisiones de diseño (ej: delegación del control de concurrencia al motor de BD vía `@@unique`, captura de `P2002`). El **historial del PR** documenta *qué cambió*, pero no el razonamiento de arquitectura. Ambos se complementan, pero para trazabilidad de decisiones técnicas la auditoría de AI-DLC es superior.

4. **¿Para qué tamaño de cambio vale la pena AI-DLC de AWS y para cuál no?**

   - **Vale la pena:** Cambios con contratos bien definidos (puerto existente, modelo de datos existente, criterio de error claro). También cuando el feature toca múltiples archivos del mismo módulo (adapter + módulo + pruebas). La trazabilidad importa para auditorías académicas o de equipo.
   - **No vale la pena:** Correcciones de una sola línea, refactors de nombre, cambios de configuración simples. El overhead de revisar 4 puertas no justifica el beneficio para cambios menores.

5. **¿Lo usarían en su proyecto? ¿Por qué?**

   **Sí, selectivamente.** En Activa360, el módulo `compliance` (Bajas SABS) es crítico y ya tiene un criterio de Intervención Humana Obligatoria definido en `AGENTS.md`. Para ese módulo, AI-DLC de AWS agrega una capa de revisión estructurada que reduce el riesgo de que el agente tome decisiones no auditadas. Para módulos menos críticos (reportes, estadísticas), el flujo conversacional directo es más eficiente. La regla práctica: **si el cambio requeriría un PR review de un líder técnico, vale la pena usar AI-DLC**.

---

## 7\. Antes de entregar

- [ ] Las dos ramas están en el repositorio y las pruebas pasan en ambas.  
- [ ] `aidlc/` y `.aidlc-version` están versionados en la rama B.  
- [ ] No hay secretos, `.env` ni archivos `*.local.json` en los commits.  
- [ ] Si es en grupo, la tabla de responsables está completa.
