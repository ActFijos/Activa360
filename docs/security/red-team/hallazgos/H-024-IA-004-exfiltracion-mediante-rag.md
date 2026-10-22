# Hallazgo de Seguridad: H-024 — Exfiltración de Datos Sensibles por Falta de Aislamiento Multitenant en ChromaDB

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-024` (Relacionado con `IA-004`) |
| **Título del Hallazgo:** | Recuperación de Embeddings y Fragmentos de Documentos de Otras Facultades en Búsquedas Vectoriales RAG |
| **Categoría:** | `IA y MCP / Búsqueda Vectorial Aislada` |
| **Componente Afectado:** | ChromaDB Vector Store / `RAGQueryService` |
| **Clasificación STRIDE:** | `Information Disclosure` (Divulgación de Información) |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 for LLM: LLM06:2025 - Sensitive Information Disclosure` |
| **Actor Atacante (Persona):** | `ATK-IA` (Usuario consultando datos en RAG) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Las colecciones de ChromaDB almacenaban embeddings de documentos de todas las facultades e institutos en un único espacio vectorial sin metadatos de filtrado por departamento (`departmentId`).

Al realizar búsquedas por similitud cosenoidal, la consulta vectorial devolvía fragmentos de documentos confidenciales de otras unidades académicas, que luego eran incorporados en la respuesta en lenguaje natural entregada al usuario.

---

## 2. Plan de Remedación
Aplicar filtrado por metadatos obligatorio (`where: { departmentId: user.departmentId }`) en cada consulta a la base de datos vectorial ChromaDB.

```typescript
const searchResults = await chromaCollection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 5,
  where: { departmentId: user.departmentId }, // Filtro multatenant obligatorio
});
```
