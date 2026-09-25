# Hallazgo de Seguridad: H-013 — Registro Duplicado Simultáneo de Inventario QR

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-013` (Relacionado con `RT-011`) |
| **Título del Hallazgo:** | Duplicación de Registros de Verificación Físicos en Escaneos QR Simultáneos por Operadores |
| **Categoría:** | `Lógica de Negocio / Concurrencia en Inventariado` |
| **Componente Afectado:** | Backend NestJS (`POST /api/inventario/qr-verify`) |
| **Clasificación STRIDE:** | `Tampering` (Inconsistencia de Registros) |
| **CWE / OWASP MAPPING:** | `CWE-362: Race Condition` |
| **Actor Atacante (Persona):** | `INVENTARIADOR` (Múltiples operadores escaneando en paralelo) |
| **Severidad Estimada:** | **MEDIO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
El sistema permitía que dos operadores con la aplicación móvil abierta registraran la comprobación física del mismo activo con pocos milisegundos de diferencia, generando duplicidad de registros en las tablas de auditoría de inventario anual.

---

## 2. Plan de Remedación
Implementar una clave única compuesta `(asset_id, inventory_campaign_id, date_trunc('day', verified_at))` en la base de datos PostgreSQL.

```sql
CREATE UNIQUE INDEX idx_unique_daily_qr_verification 
ON inventory_verifications (asset_id, inventory_campaign_id);
```
