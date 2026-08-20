# Plan de Implementación: Agente IA + MCP + Chroma para Activa360

Este plan detalla la propuesta para implementar un Agente IA con soporte para el protocolo Model Context Protocol (MCP) y una base vectorial en Chroma (RAG), garantizando que las funcionalidades y la ayuda existentes no se vean afectadas.

## Propuesta Arquitectónica (Hacer Menú de Ayuda Interactiva Independiente)

Para no alterar el funcionamiento del **Asistente IA** actual (que utiliza llamadas directas/fallbacks locales a PostgreSQL), agregaremos una nueva opción al menú colapsable de **Ayuda** en la barra de navegación lateral, aislando por completo la nueva implementación tanto a nivel de Frontend como de Backend.

```text
Menú Lateral de Ayuda actual:
├── 📄 Manuales y FAQs (/ayuda)
└── 🤖 Asistente IA (/ayuda/asistente)

Nuevo Menú Lateral propuesto:
├── 📄 Manuales y FAQs (/ayuda)
├── 🤖 Asistente IA (/ayuda/asistente) (Existente e Intacto)
└── 🧠 Agente Avanzado (MCP + RAG) (/ayuda/agente-mcp) (NUEVO)
```

## Cambios Propuestos

### 1. Infraestructura (Docker Compose)
* **Chroma DB**: Agregaremos un servicio de `chromadb` a `docker-compose.yml` para gestionar el almacenamiento vectorial e indexación de manuales y FAQs.

### 2. Backend (NestJS + MCP Server)
* **MCP Server**: Desarrollaremos el servidor MCP en `src/mcp/server.ts` utilizando `@modelcontextprotocol/sdk` para exponer herramientas como `search_assets`, `get_asset`, etc.
* **Módulo Agente MCP**: Crearemos un nuevo módulo o controlador independiente en el backend (`src/modules/assistant-mcp` o similar) que se conecte con el MCP Server y con Chroma DB, exponiendo el endpoint `/ayuda-mcp/preguntar`. Esto asegura aislamiento total del código de producción existente.

### 3. Frontend (React)
* **Layout**: Añadir el nuevo enlace en [Layout.tsx](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/frontend/src/components/Layout.tsx).
* **Ruta**: Agregar la ruta en [App.tsx](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/frontend/src/App.tsx).
* **Nueva Vista**: Crear la página `frontend/src/pages/AgenteMcp.tsx` inspirada en la interfaz existente de `AsistenteIA.tsx`, pero llamando al nuevo endpoint del backend.

---

## Plan de Trabajo por Fases (Desarrollo Incremental)

### Fase 0: Análisis y Setup de Dependencias (Actual)
* Confirmar este plan de implementación.
* Agregar dependencias necesarias (`chromadb`, `@modelcontextprotocol/sdk`) y el servicio de Chroma en Docker Compose.

### Fase 1: Chroma + RAG Pipeline
* **Extracción del Manual**: Extraeremos el manual de usuario estructurado (Introducción, Dashboard, Gestión de Activos, Transferencias, Bajas, Configuración y Preguntas Frecuentes) directamente de la sección de documentación de [Ayuda.tsx](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/frontend/src/pages/Ayuda.tsx) y crearemos un archivo markdown fuente `docs/manual_scaf.md` o lo incluiremos en un seed script.
* **Pipeline de Ingesta**: Diseñaremos e implementaremos un script/servicio en NestJS para leer este documento, segmentarlo en chunks con sus correspondientes metadatos (ej. sección, título) y generar embeddings para guardarlos en Chroma DB.
* **Herramienta RAG**: Desarrollaremos la herramienta `search_knowledge_base` para buscar semánticamente en esta colección vectorial de Chroma.

### Fase 2: MCP Server (Activa360)
* Completar el servidor MCP (`src/mcp/server.ts`) con herramientas de lectura (`search_assets`, `get_asset`, `get_asset_history`, `get_user_assets`).

### Fase 3: Orquestación del Agente
* Implementar el agente inteligente que decida entre buscar en Chroma (RAG) o ejecutar herramientas del servidor MCP en base a la consulta.

### Fase 4: Integración del Frontend e Interfaz Gráfica
* Crear el nuevo componente `AgenteMcp.tsx` y enlazarlo al menú lateral de ayuda.

---

## Plan de Verificación
* **Pruebas Unitarias/Integración**: Probar las herramientas del MCP Server de forma aislada.
* **Pruebas Funcionales**: Validar que el Asistente IA original siga respondiendo de la misma manera sin interferencias y que el nuevo Agente MCP responda correctamente combinando datos en vivo y documentación.
