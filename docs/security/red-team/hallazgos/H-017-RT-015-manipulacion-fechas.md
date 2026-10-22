# Hallazgo de Seguridad: H-017 — Inyección de Fechas Anómalas en el Histórico de Adquisiciones

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-017` (Relacionado con `RT-015`) |
| **Título del Hallazgo:** | Registro de Fechas de Adquisición en el Futuro o Anteriores a la Creación de la Entidad |
| **Categoría:** | `Lógica de Negocio / Invariantes Temporales` |
| **Componente Afectado:** | `CrearActivoDto` / `AssetDomainService` |
| **Clasificación STRIDE:** | `Tampering` / `Repudiation` |
| **CWE / OWASP MAPPING:** | `CWE-840: Business Logic Errors` |
| **Actor Atacante (Persona):** | `ATK-USER` |
| **Severidad Estimada:** | **MEDIO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
El sistema aceptaba fechas de compra del año 2099 o del año 1800, afectando los algoritmos de cálculo automático de depreciación acumulada y vida útil.

---

## 2. Plan de Remedación
```typescript
@IsDateString()
@MaxDate(() => new Date(), { message: 'La fecha de adquisición no puede ser futura' })
acquisitionDate: string;
```
