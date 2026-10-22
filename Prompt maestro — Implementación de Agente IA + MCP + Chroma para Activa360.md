# Prompt maestro para implementar Agente IA + MCP + Chroma en Activa360

## 1. Contexto del proyecto

Estoy desarrollando **Activa360**, un sistema SaaS de gestión de activos fijos.

El sistema permite administrar el ciclo de vida de los activos:

- Registro de activos
- Asignación de activos
- Transferencias
- Bajas
- Inventarios
- Consultas
- Reportes
- Configuración
- Ayuda

El objetivo es incorporar una **Ayuda IA inteligente** que no sea solamente un chatbot, sino que evolucione hacia un sistema basado en:

1. LLM
2. RAG
3. Chroma como base vectorial
4. Agente IA
5. Tool Calling
6. Model Context Protocol (MCP)
7. Acceso controlado a los datos reales de Activa360
8. Control de permisos mediante Keycloak
9. Auditoría de las operaciones realizadas por el agente

---

# 2. Arquitectura tecnológica actual

La solución actualmente utiliza o contempla:

- Frontend: React + Vite + TypeScript
- Backend: Node.js/NestJS
- Base de datos: PostgreSQL
- Autenticación/autorización: Keycloak
- Redis
- MinIO
- Docker / Docker Compose
- Traefik
- LLM
- Chroma para almacenamiento vectorial

Antes de realizar cualquier modificación debes **inspeccionar el repositorio existente** y determinar la arquitectura real implementada.

NO debes asumir que la estructura indicada anteriormente coincide exactamente con el código actual.

---

# 3. Objetivo

Quiero implementar una arquitectura de asistencia inteligente para Activa360 con el siguiente flujo conceptual:

```text
                    USUARIO
                       │
                       ▼
                ┌─────────────┐
                │  Frontend   │
                │   React     │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │  AI Agent   │
                └──────┬──────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       ┌───────────┐       ┌──────────────┐
       │   Chroma  │       │ MCP Server   │
       │    RAG    │       │  Activa360   │
       └───────────┘       └───────┬──────┘
                                   │
                                   ▼
                              PostgreSQL
```

El agente debe decidir cuándo:

- responder directamente;
- consultar la base documental mediante RAG/Chroma;
- utilizar una herramienta MCP;
- combinar información documental con datos reales del sistema;
- solicitar confirmación antes de ejecutar una operación que modifique información.

---

# 4. Principio fundamental de arquitectura

NO quiero que el LLM tenga acceso directo e irrestricto a PostgreSQL.

NO quiero que el agente pueda ejecutar SQL arbitrario.

NO quiero utilizar el LLM como sustituto de la lógica de negocio.

La arquitectura debe seguir este principio:

```text
LLM Agent
    ↓
MCP Tool
    ↓
Activa360 Backend / Servicio de dominio
    ↓
PostgreSQL
```

El agente debe trabajar mediante herramientas explícitamente definidas.

---

# 5. Papel de Chroma

Chroma debe utilizarse principalmente como **base vectorial para RAG**.

Debe almacenar información documental y conocimiento semántico de Activa360, por ejemplo:

- Manual de usuario
- Manual de inventariadores
- Procedimiento de registro de activos
- Procedimiento de asignación
- Procedimiento de transferencia
- Procedimiento de baja
- Reglamentos
- Políticas
- Preguntas frecuentes
- Documentación funcional
- Documentación técnica relevante

Flujo:

```text
PDF / DOCX / Markdown
        ↓
Extracción de texto
        ↓
Chunking
        ↓
Embeddings
        ↓
Chroma
        ↓
Retriever
        ↓
LLM
```

El sistema debe conservar metadatos de los documentos, por ejemplo:

```text
document_id
document_name
document_type
section
page
source
version
created_at
updated_at
```

Cuando sea posible, las respuestas basadas en RAG deben indicar la fuente utilizada.

---

# 6. Papel del MCP Server

Debe implementarse un **MCP Server propio para Activa360**.

No quiero desarrollar el protocolo MCP desde cero.

Debe utilizarse un SDK oficial o ampliamente soportado para el lenguaje seleccionado.

El MCP Server debe exponer herramientas de negocio.

Inicialmente considerar herramientas como:

```text
search_assets
get_asset
get_asset_history

get_user
get_user_assets

get_assignments
get_assignment_history

get_transfer_history

get_retirements

get_asset_statistics
```

Las herramientas deben diseñarse de forma segura y específica.

NO crear una herramienta como:

```text
execute_sql()
```

o:

```text
run_database_query()
```

---

# 7. Herramientas de lectura iniciales

La primera versión debe ser principalmente de consulta.

Ejemplo:

```text
search_assets(
    query,
    status?,
    category?,
    location?
)
```

```text
get_asset(
    asset_id
)
```

```text
get_user_assets(
    user_id
)
```

```text
get_asset_history(
    asset_id
)
```

```text
get_asset_statistics(
    organization_id?
)
```

Las herramientas deben utilizar los servicios existentes de Activa360 siempre que sea posible.

No duplicar lógica de negocio existente.

---

# 8. Operaciones de escritura

NO implementar inicialmente operaciones destructivas o críticas.

Posteriormente podrán existir herramientas como:

```text
create_assignment
create_transfer
request_retirement
```

Pero deberán cumplir:

1. Verificación de permisos.
2. Validación de parámetros.
3. Confirmación explícita del usuario.
4. Ejecución transaccional.
5. Registro de auditoría.
6. Manejo de errores.
7. Identificación del usuario que originó la acción.

Ejemplo:

Usuario:

> Transferir el activo ACT-00025 de Juan Pérez a María López.

El agente NO debe ejecutar inmediatamente.

Debe primero obtener la información necesaria y presentar una confirmación:

> Encontré el activo ACT-00025, actualmente asignado a Juan Pérez. ¿Confirmas que deseas transferirlo a María López?

Solo después de la confirmación podrá ejecutarse la herramienta correspondiente.

---

# 9. Agente IA

El agente debe actuar como orquestador.

Debe ser capaz de identificar la intención del usuario.

Ejemplos:

### Consulta documental

Usuario:

> ¿Cuál es el procedimiento para dar de baja un activo?

Flujo:

```text
Usuario
 ↓
Agent
 ↓
RAG
 ↓
Chroma
 ↓
Documentos relevantes
 ↓
LLM
 ↓
Respuesta con fuente
```

### Consulta de datos

Usuario:

> ¿Qué activos tiene Juan Pérez?

Flujo:

```text
Usuario
 ↓
Agent
 ↓
MCP
 ↓
get_user_assets()
 ↓
PostgreSQL
 ↓
Agent
 ↓
Respuesta
```

### Consulta híbrida

Usuario:

> Juan Pérez tiene una computadora asignada. ¿Cuál es el procedimiento para transferirla a María López?

Flujo:

```text
Agent
 ├── MCP → obtener activos de Juan
 │
 └── RAG → buscar procedimiento de transferencia
          ↓
        LLM
          ↓
      respuesta
```

---

# 10. Identificación de intención

El agente debe diferenciar al menos:

```text
DOCUMENTATION_QUERY
ASSET_QUERY
USER_ASSET_QUERY
ASSIGNMENT_QUERY
TRANSFER_QUERY
RETIREMENT_QUERY
STATISTICS_QUERY
HYBRID_QUERY
GENERAL_QUERY
```

No es obligatorio implementar un clasificador separado si el framework de agentes utilizado permite que el LLM seleccione herramientas correctamente.

Priorizar una arquitectura sencilla antes que introducir componentes innecesarios.

---

# 11. Seguridad

La seguridad es un requisito fundamental.

El sistema utiliza Keycloak.

El contexto de autenticación debe conservarse desde:

```text
Frontend
 ↓
Backend
 ↓
Agent
 ↓
MCP
```

El agente NO debe poder elevar privilegios.

El MCP Server debe verificar los permisos del usuario antes de ejecutar una herramienta.

Ejemplo:

```text
Usuario autenticado
        ↓
Keycloak
        ↓
JWT
        ↓
Backend
        ↓
Agent
        ↓
MCP
        ↓
Autorización
        ↓
Tool
```

Nunca confiar únicamente en instrucciones proporcionadas por el LLM para determinar permisos.

---

# 12. Auditoría

Toda herramienta MCP que consulte información sensible o ejecute operaciones debe permitir registrar:

```text
user_id
username
timestamp
tool
parameters
result
success
error
request_id
conversation_id
```

Para operaciones de escritura además registrar:

```text
before
after
operation
```

La auditoría debe estar separada del razonamiento interno del LLM.

NO almacenar innecesariamente cadenas de pensamiento del modelo.

---

# 13. RAG

Implementar un pipeline de ingestión:

```text
Document
   ↓
Parser
   ↓
Text extraction
   ↓
Chunking
   ↓
Embedding model
   ↓
Chroma
```

Cada chunk debe tener metadatos suficientes para identificar su origen.

Ejemplo:

```json
{
  "document_id": "manual-transferencias-001",
  "document_name": "Procedimiento de Transferencias",
  "section": "Transferencia entre funcionarios",
  "page": 12,
  "source": "manual_activa360.pdf",
  "version": "1.0"
}
```

El retrieval debe utilizar búsqueda semántica y, cuando sea apropiado, filtros por metadatos.

---

# 14. Respuestas del asistente

Las respuestas deben ser:

- claras;
- concisas;
- orientadas al usuario;
- contextualizadas;
- basadas en información disponible;
- transparentes respecto a las fuentes.

Si la información no está disponible, el agente debe decirlo.

NO inventar activos, usuarios, procedimientos ni estadísticas.

Si una respuesta proviene de PostgreSQL:

> Fuente: datos actuales de Activa360.

Si proviene de documentación:

> Fuente: Manual de Transferencias, sección X.

Si combina ambos:

> Información del activo: Activa360.
> Procedimiento: Manual de Transferencias.

---

# 15. Manejo de errores

Diseñar correctamente estos escenarios:

- Chroma no disponible.
- MCP Server no disponible.
- PostgreSQL no disponible.
- LLM no disponible.
- herramienta MCP devuelve error.
- usuario no tiene permisos.
- activo inexistente.
- usuario inexistente.
- documentación no encontrada.
- información insuficiente.
- timeout.
- respuesta ambigua del usuario.

El sistema no debe inventar una respuesta cuando una herramienta falla.

---

# 16. Observabilidad

Incorporar desde el inicio:

```text
request_id
conversation_id
user_id
tool_name
tool_duration
tool_status
retrieval_count
LLM_latency
errors
```

Esto permitirá posteriormente evaluar:

- latencia;
- errores;
- herramientas más utilizadas;
- consultas sin respuesta;
- calidad del RAG;
- costo del LLM.

---

# 17. Docker

La solución debe poder ejecutarse mediante Docker Compose.

Conceptualmente:

```text
frontend
backend
agent
mcp-server
chromadb
postgres
redis
keycloak
minio
```

Pero antes de agregar nuevos servicios debes revisar el `docker-compose.yml` existente y reutilizar servicios existentes cuando sea posible.

No crear servicios duplicados.

---

# 18. Desarrollo incremental

NO implementar todo de una sola vez.

Trabajar por fases.

## Fase 0 — Análisis

Primero inspeccionar:

- estructura del repositorio;
- frontend;
- backend;
- modelos de PostgreSQL;
- autenticación;
- Docker Compose;
- sistema actual de Ayuda IA;
- configuración del LLM;
- APIs existentes.

No modificar código todavía.

Entregar primero:

1. Arquitectura encontrada.
2. Componentes existentes reutilizables.
3. Componentes que faltan.
4. Riesgos.
5. Propuesta de implementación.

---

## Fase 1 — Chroma + RAG

Implementar:

```text
Document ingestion
Chunking
Embeddings
Chroma
Retriever
```

Crear una primera herramienta:

```text
search_knowledge_base
```

Validar preguntas documentales.

---

## Fase 2 — MCP Server

Crear:

```text
activa360-mcp-server
```

Implementar inicialmente herramientas READ ONLY:

```text
search_assets
get_asset
get_user_assets
get_asset_history
get_asset_statistics
```

Probarlas independientemente del agente.

---

## Fase 3 — Agente

Integrar:

```text
Agent
 ├── search_knowledge_base
 ├── search_assets
 ├── get_asset
 ├── get_user_assets
 └── get_asset_history
```

El agente deberá decidir qué herramienta utilizar.

---

## Fase 4 — Seguridad

Integrar:

```text
Keycloak
JWT
roles
permissions
authorization
audit
```

---

## Fase 5 — Operaciones de escritura

Solamente después de validar las fases anteriores.

Agregar:

```text
create_assignment
create_transfer
request_retirement
```

con confirmación explícita.

---

# 19. Restricciones importantes

Antes de modificar código:

- inspeccionar el repositorio;
- identificar la arquitectura actual;
- reutilizar código existente;
- evitar duplicación;
- no cambiar tecnologías sin justificarlo;
- no modificar la base de datos sin necesidad;
- no eliminar funcionalidades existentes;
- no reemplazar componentes existentes sin explicar por qué;
- mantener compatibilidad con Docker Compose;
- mantener Keycloak;
- mantener PostgreSQL como fuente transaccional;
- mantener Chroma como vector store;
- mantener separación entre datos transaccionales y conocimiento documental.

---

# 20. Forma de trabajo esperada

Quiero que actúes como **arquitecto de software y desarrollador senior especializado en IA, agentes, RAG y MCP**.

NO quiero que generes todo el código de una sola vez.

Trabaja de manera incremental.

Para cada fase:

1. Explica qué vas a modificar.
2. Identifica archivos afectados.
3. Explica las dependencias nuevas.
4. Explica cómo se integra con la arquitectura existente.
5. Implementa los cambios.
6. Proporciona pruebas.
7. Verifica errores.
8. Explica cómo ejecutar la funcionalidad.
9. Espera mi confirmación antes de pasar a la siguiente fase.

Si encuentras problemas en la arquitectura existente, indícalos antes de modificarla.

---

# 21. Primera tarea

Por ahora NO implementes código.

Primero analiza el repositorio de Activa360 y responde:

### A. Arquitectura actual

- Frontend
- Backend
- Base de datos
- autenticación
- IA existente
- Docker
- APIs

### B. Sistema de Ayuda IA existente

Identifica:

- dónde está implementado;
- cómo recibe las preguntas;
- cómo llama al LLM;
- qué modelo utiliza;
- qué información puede consultar actualmente.

### C. Propuesta

Indica exactamente dónde incorporar:

```text
Agent
MCP Server
Chroma
RAG
Tool Calling
```

### D. Diagrama

Genera un diagrama de arquitectura específico para el repositorio real.

### E. Plan

Propón las fases de implementación, empezando por:

```text
Fase 0: análisis
Fase 1: Chroma + RAG
Fase 2: MCP Server
Fase 3: Agent + Tool Calling
Fase 4: Seguridad
Fase 5: operaciones de escritura
Fase 6: evaluación y observabilidad
```

No escribas código todavía.

Primero quiero revisar y aprobar la arquitectura propuesta.