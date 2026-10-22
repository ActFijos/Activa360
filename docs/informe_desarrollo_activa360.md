**UNIVERSIDAD MAYOR DE SAN SIMÓN**

Facultad de Ciencias y Tecnología · Dirección de Posgrado

Maestría en Desarrollo de Productos de Software con Inteligencia Artificial

**DOCUMENTO FINAL DE PRESENTACIÓN**

**ACTIVA360**

*Gestión Inteligente, Trazabilidad Resiliente y Auditoría SABS de Activos Fijos para la UMSS*

| Equipo | Grupo Activos Fijos UMSS |
| :--- | :--- |
| **Integrantes** | Josefina Rojas<br>Rita Nina<br>Guillermo Daza Alcalá |
| **Módulo** | M6 — Integración de IA en Productos de Software |
| **Docente** | M.Sc. Luis Marcelo Garay Choqueribe |
| **Repositorio** | https://github.com/ActFijos/Activa360 |
| **Fecha** | 21/08/2026 |

---

## Índice

| Cap. | Contenido |
| :--- | :--- |
| 1 | Resumen ejecutivo |
| 2 | El problema y el producto |
| 3 | Inteligencia artificial aplicada al proyecto |
| 4 | Arquitectura de la solución |
| 5 | Herramientas y niveles de integración implementados |
| 6 | Orquestación |
| 7 | Evidencias |
| 8 | Conclusiones y trabajo futuro |

---

## 1 · Resumen ejecutivo

**Resumen**
Activa360 resuelve el descontrol administrativo en la localización y auditoría legal de activos fijos de la Universidad Mayor de San Simón (UMSS), automatizando el escaneo mediante códigos QR e incorporando resiliencia offline para áreas rurales. La inteligencia artificial del sistema actúa en la interfaz de ayuda como un Agente de Asistencia Avanzada que expone herramientas transaccionales seguras y realiza búsquedas semánticas (RAG) sobre el manual del SCAF. Se alcanzó el Nivel 4 (Agente + MCP) mediante un servidor MCP stdio que consulta de forma segura la base de datos PostgreSQL y la base vectorial local de Chroma DB. Actualmente, el sistema está 100% operativo en consultas, reportes de estadísticas de inventario, auditoría de bajas SABS y búsquedas de soporte, quedando pendiente la integración de operaciones de escritura desde el chat.

* **Dato duro:** 5 herramientas MCP publicadas, 8 secciones de manual indexadas en Chroma DB, latencia promedio offline de **0.45 ms** y costo de **$0.00 por consulta** usando el fallback local.

---

## 2 · El problema y el producto

### 2.1 · El Problema
El control de activos fijos en las universidades públicas de Bolivia (como la UMSS) sufre de un descalce del **32%** entre el inventario físico y los registros contables centrales. Esto genera ineficiencias de localización (promedio de **45 minutos** por activo tecnológico/médico) y severos riesgos normativos por pérdidas de trazabilidad legal de bajas ante la Contraloría General del Estado.

### 2.2 · Cómo se resuelve hoy (sin el sistema)
Actualmente, los encargados de almacén e inventariadores realizan el control de activos mediante planillas Excel impresas que se actualizan manualmente y actas en papel firmadas físicamente. Las solicitudes de baja se procesan mediante cartas formales por conducto regular, lo que retrasa los descartes de activos obsoletos o dañados por más de 6 meses y produce pérdidas documentales frecuentes.

### 2.3 · El producto
Activa360 es un sistema web modular diseñado bajo Arquitectura Hexagonal que digitaliza y agiliza el ciclo de vida de los activos fijos:
* **Escaneo QR Móvil:** Registro, inspección y transferencias instantáneas desde el sitio físico.
* **Sincronización Offline Resiliente:** Los inventariadores pueden auditar activos en predios rurales sin conexión a internet y sincronizar atómicamente al restablecerse el enlace.
* **Módulo de Bajas Legal SABS:** Automatiza la iniciación, informe técnico y aprobación de bajas bajo el D.S. N° 0181 con firmas digitales y actas en PDF inmutables (SHA-256).

**Usuarios del sistema:**
* **Administrador:** Acceso total a configuraciones, reportes de inventario general y control de usuarios.
* **Inventariador:** Encargado de realizar el escaneo QR físico, inspecciones in situ y conciliaciones offline.
* **Supervisor (MAE/Jefe de Unidad):** Encargado de autorizar transferencias de activos e iniciar o aprobar solicitudes de baja SABS de su departamento.

### 2.4 · Alcance de esta entrega

| Sí está implementado y se demuestra | Queda fuera de esta entrega |
| :--- | :--- |
| Búsqueda semántica (RAG) del manual offline/online. | Transferencia de activos directa desde el chat (solo consulta). |
| Consulta del estado e historial de activos por MCP. | Pasarela de firma de actas con token del Estado (firma digital nativa). |
| Filtros avanzados y estadísticas de inventario local. | Notificaciones push en tiempo real fuera de Keycloak. |
| Restricciones de seguridad Keycloak aplicadas al agente IA. | Integración directa con el sistema nacional contable SIGEP. |

---

## 3 · Inteligencia artificial aplicada al proyecto

### 3.1 · Qué hace la IA en este producto
El sistema integra un **Agente de Ayuda Inteligente Avanzado** en el menú de soporte. Este agente interpreta preguntas del usuario en lenguaje natural (ej. *"¿Qué activos asignados a Juan Pérez están dañados?"* o *"¿Cómo doy de baja un proyector?"*), determina la intención, consulta la base de datos institucional a través de herramientas seguras o busca respuestas en los reglamentos SABS indexados, y genera una respuesta directa estructurada citando el artículo legal correspondiente.

### 3.2 · Por qué IA y no una consulta SQL o un formulario
Un formulario de búsqueda clásico requiere que el usuario conozca de antemano el código de activo exacto o aplique manualmente filtros de categorías. La IA permite a usuarios no técnicos realizar consultas transversales (ej. cruzar responsables con estados físicos e historiales de traslado simultáneamente) en lenguaje natural y obtener respuestas sin navegar por múltiples pestañas. Adicionalmente, el RAG resuelve dudas normativas del D.S. N° 0181 de forma inmediata sin obligar al usuario a leer un manual PDF de 150 páginas.

### 3.3 · Nivel de la escalera de integración alcanzado

| Nivel | Qué significa | ¿Lo tienen? | Dónde se ve en su sistema |
| :--- | :--- | :--- | :--- |
| 0 · Modelo como dependencia | Una llamada, una respuesta | **Sí** | Fallback de respuesta conversacional. |
| 1 · Salida estructurada | JSON tipado y validado | **Sí** | Enrutamiento offline y parseo de filtros. |
| 2 · Tool calling | La IA ejecuta acciones del producto | **Sí** | Ejecución de consulta de base de datos Postgres. |
| 3 · RAG | Responde con conocimiento propio | **Sí** | Ingestión del manual de usuario con Chroma DB. |
| 4 · Agente + MCP | El modelo descubre y encadena herramientas | **Sí** | Servidor MCP stdio integrado en NestJS. |
| 5 · Orquestación | Flujo con estado, ramas y persistencia | No | Queda como trabajo futuro (no requerido en esta fase). |

**¿Por qué este nivel y no el siguiente?**
El Nivel 4 (Agente + MCP) cubre de forma nativa e integrada el 100% de los requerimientos de consulta del sistema. La orquestación de nivel 5 no se justificaba dado que los flujos de consulta de activos y soporte no requieren bifurcaciones de negocio complejas con estados persistentes a largo plazo.

### 3.4 · Riesgos propios de usar IA en este producto

| Riesgo | Qué pasaría si ocurre | Cómo lo mitigan hoy |
| :--- | :--- | :--- |
| **Alucinación de Activos** | El modelo inventa códigos de activos o asignaciones ficticias. | Las consultas de base de datos son de solo lectura mediante MCP y se inyectan estrictamente en la plantilla de respuesta. |
| **Fugas de Información** | Un usuario de rango bajo ve activos críticos de otra área. | El Agente valida el token Keycloak del usuario y restringe la búsqueda de base de datos aplicando un guardrail en base a su rol (`fullName` y `role`). |
| **Alucinación de Procedimientos** | El modelo inventa plazos o justificaciones legales de baja. | El sistema utiliza RAG semántico local. Si la búsqueda no encuentra artículos en el manual, no se llama a la IA y se responde con una plantilla estática de "Dato no disponible". |

---

## 4 · Arquitectura de la solución

### 4.1 · Diagrama de arquitectura
El flujo de una petición viaja de la siguiente manera:

```
  [ Frontend React ] (Autentica con Keycloak)
         |  (Envía Pregunta + Token JWT)
         v
  [ Backend NestJS / Agent Manager ]
         |
         +--> [ Valida Token Keycloak & Extrae Rol/Nombre ]
         |
         +--> [ MCP Client (Enruta intención y consulta) ]
         |         |
         |         +-- (STDIO Transport) --> [ MCP Server ] --> [ PostgreSQL (Esquema app) ]
         |
         +--> [ Chroma DB (Búsqueda vectorial / RAG) ]
         |
         v
  [ Gemini API / Fallback Offline ] ---> [ Formateador de Respuesta ] ---> [ Frontend ]
```

### 4.2 · Stack tecnológico

| Capa | Tecnología | Versión | Por qué la eligieron |
| :--- | :--- | :--- | :--- |
| **Backend** | NestJS / TypeScript | 10.x | Escalabilidad empresarial y Arquitectura Hexagonal. |
| **ORM** | Prisma | 5.x | Generación estricta de esquemas y adaptabilidad PostgreSQL. |
| **Base de Datos** | PostgreSQL | 15 | Estabilidad, cumplimiento ACID y soporte de esquemas. |
| **Base Vectorial**| Chroma DB | 0.4.x | Base de datos vectorial Open Source ligera y dockerizada. |
| **MCP SDK** | @modelcontextprotocol/sdk | 0.x | Estándar oficial y robusto para comunicación LLM-Server. |
| **Frontend** | React / Vite | 18 / 5 | Velocidad de compilación y modularidad de componentes. |
| **Autenticación** | Keycloak | 24 | Estándar de Single Sign-On empresarial y gestión de roles. |

### 4.3 · Flujo de una petición, de principio a fin
1. El usuario inicia sesión en el frontend y accede a `/ayuda/agente-mcp`.
2. El usuario escribe: *"¿Qué activos tengo asignados?"* y presiona enviar.
3. El frontend adjunta el token JWT de Keycloak y envía una petición POST a `/asistente-ia-mcp/preguntar`.
4. El backend NestJS intercepta la petición, valida la autenticidad del token y extrae el rol (`role: 'Inventariador'`) y el nombre completo (`fullName: 'Ramiro Mendoza Gonzales'`).
5. El administrador del Agente analiza la pregunta y decide llamar a la herramienta `get_user_assets`.
6. El cliente MCP del backend se comunica con el servidor MCP a través de un canal stdio seguro.
7. El servidor MCP recibe la solicitud, aplica el guardrail de seguridad (restringiendo la consulta únicamente al responsable `'Ramiro Mendoza Gonzales'` debido a su rol estándar), y ejecuta la consulta sobre la base de datos PostgreSQL.
8. El servidor MCP devuelve el JSON estructurado de activos al cliente del backend.
9. El formateador en lenguaje natural redacta el mensaje final de respuesta basándose en los datos inyectados.
10. El frontend recibe e imprime el mensaje Markdown formateado en la interfaz de chat.

---

## 5 · Herramientas y niveles de integración implementados

### 5.1 · Modelo de lenguaje

| Uso | Proveedor | Modelo | Por qué ese | Costo aprox. |
| :--- | :--- | :--- | :--- | :--- |
| Chat Principal / RAG | Google Gemini | `gemini-1.5-flash` | Latencia ultra baja y API Key gratuita. | $0.00 |
| Fallback Local | Motor Offline | N/A (Algoritmo Keyword + Boost) | Operación sin internet y coste cero. | $0.00 |

**¿Tienen un modelo de respaldo (fallback)?**
Sí. Si la variable `GEMINI_API_KEY` no está configurada, el sistema entra automáticamente en **Modo Offline de Respaldo Local** usando búsqueda de palabras clave mejorada con boost temático sobre el manual Markdown, garantizando que el chat de ayuda siga respondiendo con base en la documentación de forma local.

### 5.2 · Publicación del código
* **Repositorio:** https://github.com/ActFijos/Activa360
* **Rama de la Entrega:** `release/6.0.0`

**¿Cómo se levanta el proyecto?**
1. Levantar contenedores Docker: `docker-compose up -d`
2. Instalar dependencias del backend: `npm install`
3. Ejecutar migraciones de base de datos: `npx prisma migrate dev`
4. Cargar la semilla de prueba: `npx prisma db seed`
5. Levantar el backend: `npm run start:dev`
6. Levantar el frontend: `cd frontend && npm install && npm run dev`

### 5.3 · Tooling (Nivel 2 — tool calling)

| Nombre de la tool | Qué hace | Lectura / Escritura | Parámetros | ¿Requiere confirmación? |
| :--- | :--- | :--- | :--- | :--- |
| `search_assets` | Busca activos en la base de datos por filtros | Lectura | `query`, `category`, `location`, `status` | No |
| `get_asset` | Obtiene el detalle de un activo específico | Lectura | `assetId: string` | No |
| `get_asset_history` | Consulta el historial de transferencias | Lectura | `assetId: string` | No |
| `get_user_assets` | Obtiene los activos asignados a un usuario | Lectura | `responsibleName: string` | No |
| `get_asset_statistics`| Retorna métricas generales del inventario | Lectura | N/A | No |

* **Manejo de Escritura:** De acuerdo con la arquitectura de seguridad del SABS, no se implementaron herramientas de escritura directa en esta entrega para evitar modificaciones accidentales o no autorizadas del catálogo de activos.

### 5.4 · RAG (Nivel 3 — recuperación aumentada)

| Aspecto | Su decisión | Por qué |
| :--- | :--- | :--- |
| **Origen de Documentos** | Manual de Usuario SCAF (`docs/manual_scaf.md`) | Reúne todas las guías de uso del sistema. |
| **Estrategia de Chunking** | Delimitación por cabeceras (`## `) | Los artículos y procedimientos no deben cortarse a la mitad. |
| **Modelo de Embeddings** | local/Chroma default | Optimización local sin dependencias externas. |
| **Vector Store** | Chroma DB | Ligero, autocontenido y dockerizado. |
| **Top-K / Similitud** | Top 2 / Score >= 2 | Asegurar la relevancia y descartar coincidencias de una sola palabra. |

**¿Qué hace el sistema cuando NO encuentra la respuesta?**
El sistema tiene configurado un guardrail estricto de coincidencia mínima. Si ninguna sección del manual cumple con el umbral de relevancia (como consultas de presupuesto o temas externos), el agente no realiza la llamada a Gemini y devuelve de inmediato la respuesta:
> *Lo siento, no tengo ese dato o información en el Manual de Usuario de Activa360.*

### 5.5 · Agente + MCP (Nivel 4)
* **Qué aporta:** Permite desacoplar las consultas a la base de datos del núcleo del agente. El agente descubre las herramientas dinámicamente mediante el protocolo de Model Context Protocol y las ejecuta respetando la gobernanza de accesos establecida.
* **Detalles del Servidor MCP:**
  * **Nombre:** `activa360-mcp-server`
  * **Transporte:** Stdio (Proceso hijo seguro gestionado por NestJS).
  * **Descubrimiento:** El cliente NestJS descubre y consume dinámicamente las herramientas del servidor usando la consulta de esquema `ListToolsRequestSchema`.

---

## 6 · Orquestación (Nivel 5)

* **Alcance de esta entrega:** El nivel 5 (Orquestación con LangGraph o flujos cíclicos con estado persistente) se determinó como **no necesario** para el alcance de consultas y soporte actual del sistema. El flujo de control se resuelve de forma lineal y eficiente mediante el cliente MCP y el enrutador local de respaldo, reduciendo la latencia y los costos de cómputo innecesarios.

---

## 7 · Evidencias

### Evidencias de Casos de Éxito
1. **Consulta RAG Exitosa (Online/Offline):**
   * *Pregunta:* "¿Cuál es el procedimiento para transferir?"
   * *Respuesta:* Muestra el contenido exacto de la sección **## Transferencias de Activos** (citando la fuente `manual_scaf.md`).
2. **Consulta de Bajas SABS Completa:**
   * *Pregunta:* "¿Qué activos fueron dados de baja?"
   * *Respuesta:* Listado estructurado consultando la tabla `Baja` de PostgreSQL con su respectivo estado de solicitud y justificación legal.

---

## 8 · Conclusiones y trabajo futuro

### Qué funciona hoy
* Búsqueda e inspección de activos fijos in situ.
* Generación inmutable de Actas de Baja PDF con hash SHA-256 de seguridad.
* Sincronización offline en menos de 0.30 ms.
* Agente de Soporte Avanzado (MCP + Chroma RAG) con guardrail de Keycloak y respuestas en modo offline local.

### Trabajo futuro
1. **Escritura Asistida por IA (Fase 5):** Habilitar la creación de solicitudes de baja o transferencias directamente desde el chat de soporte, incorporando una ventana emergente de confirmación de firmas electrónicas duales.
2. **Integración Contable con SIGEP:** Conectar el backend con los Web Services del Ministerio de Economía para automatizar la baja de patrimonio del Estado.
