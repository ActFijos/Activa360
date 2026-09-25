# Hallazgo de Seguridad: H-019 — Bypass de Validaciones del Frontend mediante Acceso Directo a REST API

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-019` (Relacionado con `RT-017`) |
| **Título del Hallazgo:** | Dependencia Insegura de Validaciones en el Cliente React sin Controles Equivalentes en el Backend |
| **Categoría:** | `API y Cliente / Bypass de UI` |
| **Componente Afectado:** | REST Endpoints en NestJS |
| **Clasificación STRIDE:** | `Tampering` / `Elevation of Privilege` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A04:2021 - Insecure Design / CWE-602` |
| **Actor Atacante (Persona):** | `ATK-USER` (Usuario que intercepta peticiones con Postman/cURL) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Se constató que ciertas reglas de negocio (como deshabilitar botones de edición para bienes dados de baja o bloquear formularios de transferencia) solo estaban implementadas en la interfaz de usuario React. Un atacante omitiendo el navegador enviaba peticiones HTTP directas con herramientas como Postman, logrando ejecutar las acciones deshabilitadas en la UI.

---

## 2. Plan de Remedación
Toda regla de interfaz debe ser replicada obligatoriamente en la capa de servicios de aplicación del backend (`Use Cases`).
