# Hallazgo de Seguridad: H-015 — Transición Arbitraria e Invalidadora del Estado de Activos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-015` (Relacionado con `RT-013`) |
| **Título del Hallazgo:** | Saltos No Autorizados en la Máquina de Estados Finita del Ciclo de Vida de los Activos Fijos |
| **Categoría:** | `Lógica de Negocio / Máquina de Estados` |
| **Componente Afectado:** | Domain Entity `Asset` / `CambiarEstadoAssetUseCase` |
| **Clasificación STRIDE:** | `Tampering` |
| **CWE / OWASP MAPPING:** | `CWE-840: Business Logic Errors` |
| **Actor Atacante (Persona):** | `ATK-USER` / `INVENTARIADOR` |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Un usuario podía cambiar el estado de un activo directamente de `REGISTRADO` a `DISPOSED` (Dado de baja) sin pasar por las etapas intermedias obligatorias (`ASIGNADO`, `SOLICITUD_BAJA`, `REVISION_SABS`), rompiendo el flujo normativo de auditoría.

---

## 2. Plan de Remedación (State Pattern)
Implementar una máquina de estados estricta en el dominio de la entidad `Asset`:

```typescript
const ALLOWED_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  [AssetStatus.REGISTERED]: [AssetStatus.ASSIGNED, AssetStatus.MAINTENANCE],
  [AssetStatus.ASSIGNED]: [AssetStatus.DISPOSAL_REQUESTED, AssetStatus.TRANSFER_PENDING],
  [AssetStatus.DISPOSAL_REQUESTED]: [AssetStatus.DISPOSED, AssetStatus.ASSIGNED],
  [AssetStatus.DISPOSED]: [],
};
```
