# Hallazgo de Seguridad: H-014 — Reutilización Fraudulenta de Códigos QR Físicos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-014` (Relacionado con `RT-012`) |
| **Título del Hallazgo:** | Reutilización de Payload QR Estático para Falsificar la Presencia de Bienes Físicos en Auditorías |
| **Categoría:** | `Lógica de Negocio / Seguridad en Criptografía de QR` |
| **Componente Afectado:** | Módulo de Validación QR (`QRValidationService`) |
| **Clasificación STRIDE:** | `Spoofing` / `Tampering` |
| **CWE / OWASP MAPPING:** | `CWE-294: Capture-replay Failure` |
| **Actor Atacante (Persona):** | `INVENTARIADOR` (Operador intentando auditar bienes sin estar presente) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Los códigos QR pegados a los activos fijos contenían únicamente el string del código patrimonial en texto plano (`"ACT-001928"`). Esto permitía a un operador malicioso fotografiar la etiqueta y re-enviar la solicitud de comprobación física desde cualquier lugar fuera de la oficina o campus universitario.

---

## 2. Plan de Remedación
Implementar firmas con Timestamp de un solo uso (TOTP/HMAC) o geolocalización requerida en la carga útil del QR dinámico.

```typescript
// Payload firmado con secret y timestamp expirable
const isQrValid = hmacVerify(payload.code, payload.timestamp, payload.signature);
if (Date.now() - payload.timestamp > 30000) {
  throw new ExpiredQrException('El código QR ha expirado');
}
```
