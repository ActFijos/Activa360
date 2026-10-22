# Hallazgo de Seguridad: H-018 — Alteración o Eliminación de Registros en la Bitácora de Auditoría

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-018` (Relacionado con `RT-016`) |
| **Título del Hallazgo:** | Vulneración de la Inmutabilidad de la Bitácora de Auditoría Patrimonial |
| **Categoría:** | `Lógica de Negocio / Inmutabilidad de Auditoría` |
| **Componente Afectado:** | PostgreSQL Database / `AuditLogRepository` |
| **Clasificación STRIDE:** | `Repudiation` (Repudio de Acciones) / `Tampering` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A09:2021 - Security Logging and Monitoring Failures / CWE-117` |
| **Actor Atacante (Persona):** | `ADMIN-ACTIVOS` (Administrador intentando encubrir irregularidades) |
| **Severidad Estimada:** | **CRÍTICO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Se identificó que los administradores del sistema o usuarios con acceso a la capa de persistencia podían ejecutar consultas de edición `UPDATE` o `DELETE` sobre la tabla `audit_logs`, eliminando la evidencia de transferencias o bajas no autorizadas de bienes.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS: 7.5 - ALTO / CRÍTICO)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Imposibilidad de auditar fraudes patrimoniales o sustracciones | `10` |
| **Reproducibility (Reproducibilidad)** | Alta | `8` |
| **Exploitability (Explotabilidad)** | Requiere permisos de escritura en tabla audit | `6` |
| **Affected Users (Usuarios Afectados)** | Toda la trazabilidad histórica de la institución | `9` |
| **Discoverability (Descubrimiento)** | Detectable en auditorías forenses | `7` |
| **Promedio DREAD:** | **8.0** | **CRÍTICO** |

---

## 3. Plan de Remedación (Append-Only Triggers)
Crear un Trigger inmutable a nivel de PostgreSQL que rechace cualquier mutación sobre la tabla `audit_logs`:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'LOS REGISTROS DE AUDITORÍA SON INMUTABLES Y NO PUEDEN SER MODIFICADOS NI ELIMINADOS.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
```
