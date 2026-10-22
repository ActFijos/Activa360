---
name: implement-activa360-backend-uc
description: >
  Implementa un Caso de Uso (FSD-UC-XXX) para el backend del Sistema Inteligente de Gestión de Activos Fijos (Activa360). 
  Entrada: ID del Caso de Uso del docs/fsd/FSD_vFinal.md. 
  Salida: Código NestJS estructurado en arquitectura hexagonal (Controller, UseCase, Repository) y tests unitarios básicos (Jest).
allowed-tools:
  - read
  - edit
  - run-tests
model-tier: sonnet
fsd-version-min: v0.1
status: stable
owner: "Equipo Activa360"
---

# Skill: Implementar Caso de Uso Backend Activa360

## 1. Cuándo activarlo (triggers)
- **DURANTE**: Fase de implementación de código backend.
- **ARRANCA cuando**: El usuario te solicita implementar un caso de uso específico mencionando el ID (ej. "Implementa FSD-UC-001" o "Escribe el endpoint para escaneo QR según FSD").
- **NO ACTIVAR cuando**: El usuario esté pidiendo sugerencias de diseño, modificando el modelo de datos sin referencia al FSD, o editando documentos de negocio (BRD/PRD).

## 2. Entradas obligatorias (Inputs)
Para ejecutar esta tarea, el usuario DEBE proporcionar:
- El ID del caso de uso (ej. `FSD-UC-001`).
- Acceso de lectura al archivo `docs/fsd/FSD_vFinal.md`.
Si no se provee, responde: *"Por favor, indícame qué FSD-UC-XXX del documento FSD_vFinal.md deseas implementar."*

## 3. Fuentes de verdad (orden de precedencia)
1. Fragmento específico del caso de uso en `docs/fsd/FSD_vFinal.md` (Flujo principal, Excepciones, Criterios Gherkin).
2. Reglas de Negocio aplicables de la tabla §5 (ej. `BR-001`, `BR-002`).
3. Diccionario de Datos en la sección §6.2 del FSD.
4. El Documento Técnico Inicial (`docs/dti/DTI_vFinal.md`) para respetar el stack: **NestJS, PostgreSQL, Hexagonal Architecture**.

## 4. Procedimiento
1. **Verificar**: Lee el FSD_vFinal.md, localiza el ID del caso de uso, el prompt-contrato (sección §7) y las reglas de negocio asociadas.
2. **Resumir**: Lista en 3 viñetas qué vas a crear (ej. Puerto de entrada, Adaptador REST, Puerto de salida, Entidad de Dominio).
3. **Mapear Arquitectura**: Todo el código debe ir a la estructura hexagonal (ej. `src/modules/inventory/adapters/in/web`, `src/modules/inventory/domain/ports/out`).
4. **Implementar**: Escribe el código. NO inventes columnas que no estén en el diccionario de datos. NO inventes pasos del flujo que no estén en el FSD.
5. **Testing**: Escribe un archivo `.spec.ts` de Jest que cubra obligatoriamente los Criterios de Aceptación Gherkin definidos en el FSD.

## 5. Salida esperada
- Archivos `.ts` creados o modificados.
- Al finalizar, imprime una **Tabla de Trazabilidad** con este formato:

| FSD / BR ID | Archivo de implementación | Test asociado |
| :---- | :---- | :---- |
| FSD-UC-001 | `src/.../adapters/in/web/sync.controller.ts` | `sync.controller.spec.ts` |
| BR-001 | `src/.../domain/asset.entity.ts` | `asset.entity.spec.ts` |

## 6. Verificación (criterios de "bien hecho")
- El Controller expone la ruta REST exacta y valida el DTO de entrada.
- El repositorio usa la entidad correcta mapeada a PostgreSQL.
- Se lanzan excepciones HTTP claras si se viola una regla (ej. `BR-003`).

## 7. Anti-patrones específicos a evitar
- Mezclar llamadas a la base de datos (TypeORM/Prisma) dentro del Controller. Toda validación de negocio debe vivir en un Servicio (UseCase).
- Ignorar el manejo de fechas (las marcas de tiempo en sincronización offline son críticas según el DTI).
- Hardcodear contraseñas, URLs de base de datos o usar librerías externas no declaradas en el DTI.
