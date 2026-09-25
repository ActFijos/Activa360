# Hallazgo de Seguridad: H-021 — Carga de Archivos Adjuntos No Sanitizados sin Restricción de Tipo MIME

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-021` (Relacionado con `RT-019`) |
| **Título del Hallazgo:** | Carga Arbitraria de Archivos (Unrestricted File Upload) en Fichas de Bienes Patrimoniales |
| **Categoría:** | `API y Cliente / Gestión Insegura de Archivos` |
| **Componente Afectado:** | `UploadsController` / `Multer Storage` |
| **Clasificación STRIDE:** | `Tampering` / `Denial of Service` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A04:2021 - Insecure Design / CWE-434` |
| **Actor Atacante (Persona):** | `ATK-USER` |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
El endpoint de carga de comprobantes o facturas (`POST /api/activos/{id}/attachments`) aceptaba archivos con extensiones ejecutable `.html`, `.svg`, `.exe` o scripts PHP/JS, permitiendo hosting de phishing y ataques XSS almacenado a través del servidor de archivos estáticos.

---

## 2. Plan de Remedación
Implementar un `fileFilter` estricto con comprobación de firmas mágicas (*Magic Bytes*) y renombrado estocástico de archivos.

```typescript
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
    return callback(new BadRequestException('Solo se permiten formatos JPG, PNG y PDF'), false);
  }
  callback(null, true);
};
```
