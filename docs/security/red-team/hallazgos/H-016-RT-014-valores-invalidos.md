# Hallazgo de Seguridad: H-016 — Inyección de Valores Numéricos y Financieros Límite Inválidos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-016` (Relacionado con `RT-014`) |
| **Título del Hallazgo:** | Aceptación de Valores de Adquisición Negativos o Desbordamientos Numéricos (NaN / Infinity) en DTOs |
| **Categoría:** | `Lógica de Negocio / Validación de Entrada` |
| **Componente Afectado:** | `CrearActivoDto` / `Class-Validator` |
| **Clasificación STRIDE:** | `Tampering` (Corrupción Contable) |
| **CWE / OWASP MAPPING:** | `CWE-1284: Improper Validation of Specified Quantity in Input` |
| **Actor Atacante (Persona):** | `ATK-USER` |
| **Severidad Estimada:** | **MEDIO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
El envío de valores contables negativos (`"cost": -99999.00`) o cadenas flotantes no numéricas provocaba distorsiones en los balances generales de depreciación patrimonial de la institución.

---

## 2. Plan de Remedación
Asegurar validadores numéricos estrictos en el DTO:

```typescript
export class CrearActivoDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El valor de adquisición debe ser mayor a 0' })
  @Max(10000000.00)
  cost: number;
}
```
