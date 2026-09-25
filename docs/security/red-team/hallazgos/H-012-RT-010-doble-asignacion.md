# Hallazgo de Seguridad: H-012 — Condición de Carrera en Asignaciones Simultáneas (Race Condition)

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-012` (Relacionado con `RT-010`) |
| **Título del Hallazgo:** | Inconsistencia Patrimonial por Asignaciones Concurrentes del Mismo Activo a Dos Custodios Distintos |
| **Categoría:** | `Lógica de Negocio / Concurrencia y Bloqueos` |
| **Componente Afectado:** | Backend NestJS (`AsignarActivoUseCase` / TypeORM Transaction Manager) |
| **Clasificación STRIDE:** | `Tampering` (Manipulación de Estado / Inconsistencia DB) |
| **CWE / OWASP MAPPING:** | `CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization` |
| **Actor Atacante (Persona):** | `ADMIN-ACTIVOS` (Peticiones concurrentes intencionales o por latencia de red) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Cuando se envían dos solicitudes HTTP de asignación casi simultáneas (con milisegundos de diferencia) para el mismo activo hacia dos custodios diferentes, el backend procesaba ambas peticiones en paralelo sin bloqueos pesimistas en la base de datos, dejando el activo con asignación duplicada o inconsistencias en la tabla relacional.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N` (Puntaje Base: **5.3 - ALTO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Ambigüedad de custodia legal sobre bienes de alto valor | `8` |
| **Reproducibility (Reproducibilidad)** | Media (requiere herramientas de testeo de concurrencia) | `6` |
| **Exploitability (Explotabilidad)** | Media | `6` |
| **Affected Users (Usuarios Afectados)** | Registros de activos y custodios | `7` |
| **Discoverability (Descubrimiento)** | Media | `6` |
| **Promedio DREAD:** | **6.6** | **ALTO** |

---

## 3. Descripción Técnica y Causa Raíz
El repositorio TypeORM ejecutaba `findOne()` seguido de `save()` en transacciones aisladas simples (`READ COMMITTED`) sin aplicar `PESSIMISTIC_WRITE` lock o versiones optimistas (`@VersionColumn`).

---

## 4. Plan de Remedación

```typescript
return await entityManager.transaction(async (transactionalEntityManager) => {
  const asset = await transactionalEntityManager.findOne(Asset, {
    where: { id: assetId },
    lock: { mode: 'pessimistic_write' },
  });
  // Validar y asignar
});
```

---

## 5. Prueba Automatizada de Concurrencia

```typescript
it('Debe evitar la doble asignación cuando se ejecutan dos peticiones concurrentes', async () => {
  const req1 = request(app.getHttpServer())
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ assetId: 'ACT-RACECOND-01', custodianId: 'USR-A' });

  const req2 = request(app.getHttpServer())
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ assetId: 'ACT-RACECOND-01', custodianId: 'USR-B' });

  const [res1, res2] = await Promise.all([req1, req2]);
  const statusCodes = [res1.status, res2.status].sort();

  expect(statusCodes).toEqual([201, 409]); // Una exitosa, otra rechazada por conflicto
});
```
