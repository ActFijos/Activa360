![][image1]

**UNIVERSIDAD MAYOR DE SAN SIMÓN**

Facultad de Ciencias y Tecnología · Dirección de Posgrado

Maestría en Desarrollo de Productos de Software con Inteligencia Artificial

**DOCUMENTO FINAL DE PRESENTACIÓN**

**\[NOMBRE DEL PROYECTO\]**

*\[Una línea que diga qué hace el producto y para quién\]*

| Equipo | \[nombre del equipo\] |
| :---- | :---- |
| **Integrantes** | \[apellidos y nombres, uno por línea\] |
| **Módulo** | M6 — Integración de IA en Productos de Software |
| **Docente** | M.Sc. Luis Marcelo Garay Choqueribe |
| **Repositorio** | \[URL pública del código\] |
| **Fecha** | \[dd/mm/2026\] |

**Cómo usar esta plantilla**

Todo lo que está entre corchetes \[así\] se reemplaza. Las cajas de color son **instrucciones para ustedes** y **se borran antes de entregar**. Las filas en gris cursiva dentro de las tablas son ejemplos: bórrenlas también.

* **Extensión sugerida:** 8 a 14 páginas sin contar anexos. Se evalúa la precisión, no el peso.  
* **Regla de oro:** todo lo que se afirma se puede demostrar. Si dicen que tienen RAG, tiene que haber una captura, un endpoint o una línea de código que lo pruebe.  
* **Si algo no lo implementaron,** escríbanlo y expliquen por qué. Un «no lo hicimos porque nuestro caso no lo justifica» bien argumentado vale más que un capítulo inventado.  
* **Capítulo 6 (orquestación):** es opcional. Solo lo completan los equipos que alcanzaron a implementarla.

| Lo que más resta puntos.  Afirmar una capacidad sin evidencia, y usar un nivel de integración más alto del que el problema necesita. Un agente donde bastaba un \`if\` resta en «patrón justificado». Demostrar criterio pesa más que demostrar músculo. |
| :---- |

**Índice**

| Cap. | Contenido | Págs. sugeridas |
| :---- | :---- | :---- |
| 1 | Resumen ejecutivo | 1 |
| 2 | El problema y el producto | 1–2 |
| 3 | Inteligencia artificial aplicada al proyecto | 2–3 |
| 4 | Arquitectura de la solución | 1–2 |
| 5 | Herramientas y niveles de integración implementados | 3–5 |
| 6 | Orquestación (opcional) | 1–2 |
| 7 | Evidencias | 1–2 |
| 8 | Conclusiones y trabajo futuro | 1 |
| — | Anexos: capturas, trazas, enlaces | libre |

**1 · Resumen ejecutivo**

*Media página. Se escribe AL FINAL, cuando el resto ya está listo.*

Debe poder leerse solo y dejar claras cinco cosas, en este orden:

* Qué problema resuelve el producto y para quién.  
* Qué parte del producto usa inteligencia artificial (no todo el sistema: la parte concreta).  
* Qué nivel de la escalera de integración alcanzaron, y por qué ese y no otro.  
* Qué está funcionando hoy y qué queda pendiente.  
* Un dato duro: número de herramientas, documentos indexados, tiempo de respuesta o costo por consulta.

**Resumen**   *6 a 10 líneas. Sin adjetivos de marketing.*

| \[completar\]  |
| :---- |

| Prueba para saber si el resumen sirve.  Dénselo a leer a alguien que no esté en el equipo. Si al terminar puede explicar en una frase qué hace la IA en el producto, el resumen está bien. Si no, hay que reescribirlo. |
| :---- |

**2 · El problema y el producto**

**2.1 · El problema**

**¿Qué problema real existe hoy, y a quién le duele?**   *Sin IA todavía. Solo el problema, como si la IA no existiera.*

| \[completar\]  |
| :---- |

**2.2 · Cómo se resuelve hoy (sin el sistema)**

**El proceso actual**   *Manual, en papel, por WhatsApp, en una hoja de cálculo… descríbanlo tal cual es.*

| \[completar\]  |
| :---- |

**2.3 · El producto**

**Qué construyeron y qué hace**

| \[completar\]  |
| :---- |

**Usuarios del sistema**   *Perfiles y qué hace cada uno.*

| \[completar\]  |
| :---- |

**2.4 · Alcance de esta entrega**

Marquen con claridad qué entra y qué no en lo que van a demostrar.

| Sí está implementado y se demuestra | Queda fuera de esta entrega |
| :---- | :---- |
| *Ej: consulta de estado y búsqueda en reglamento* | *Ej: pagos en línea — no es parte del alcance del módulo* |
|  |  |
|  |  |
|  |  |
|  |  |

**3 · Inteligencia artificial aplicada al proyecto**

*El capítulo central. Aquí se justifica por qué hay IA en este producto y qué hace exactamente.*

**3.1 · Qué hace la IA en este producto**

Sean concretos. No vale «el sistema usa IA para mejorar la experiencia». Vale «el sistema convierte una pregunta en lenguaje natural en una consulta al catálogo y devuelve la respuesta citando el artículo del reglamento».

**La función que cumple la IA**

| \[completar\]  |
| :---- |

**3.2 · Por qué IA y no una consulta SQL o un formulario**

| Esta es la pregunta que más se cae en la defensa.  Si el problema se resolvía con un buscador, un filtro o un formulario bien hecho, ponerle un modelo de lenguaje encima es sobre-ingeniería. Contesten con honestidad: ¿qué aporta la IA que la alternativa clásica no daba? Si la respuesta es «nada», díganlo — y expliquen dónde SÍ la justifican. |
| :---- |

**Justificación**

| \[completar\]  |
| :---- |

**3.3 · Nivel de la escalera de integración alcanzado**

Marquen el nivel máximo que tienen funcionando y descríbanlo en una línea.

| Nivel | Qué significa | ¿Lo tienen? | Dónde se ve en su sistema |
| :---- | :---- | :---- | :---- |
| 0 · Modelo como dependencia | una llamada, una respuesta | \[ \] |  |
| 1 · Salida estructurada | JSON tipado y validado | \[ \] |  |
| 2 · Tool calling | la IA ejecuta acciones del producto | \[ \] |  |
| 3 · RAG | responde con conocimiento propio y cita la fuente | \[ \] |  |
| 4 · Agente \+ MCP | el modelo encadena pasos y descubre herramientas | \[ \] |  |
| 5 · Orquestación | flujo con estado, ramas y persistencia | \[ \] |  |

**¿Por qué ese nivel y no el siguiente?**   *«No lo necesitábamos» es una respuesta válida y bien vista. «No nos dio el tiempo» también, si dicen qué falta.*

| \[completar\]  |
| :---- |

**3.4 · Riesgos propios de usar IA en este producto**

Todo sistema con un modelo de lenguaje tiene riesgos que un CRUD no tiene. Identifiquen los suyos y digan cómo los mitigan.

| Riesgo | Qué pasaría si ocurre | Cómo lo mitigan hoy |
| :---- | :---- | :---- |
| *Ej: el modelo inventa un plazo administrativo* | *El usuario reclama sobre una fecha que no existe* | *No se responde sin citar el artículo de la fuente* |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**4 · Arquitectura de la solución**

**4.1 · Diagrama de arquitectura**

Inserten aquí el diagrama. Debe mostrar, como mínimo: el cliente, su backend, el proveedor del modelo, el almacenamiento de datos y —si aplica— el vector store y el servidor MCP. Marquen con una flecha por dónde viaja la pregunta del usuario.

**\[Insertar imagen del diagrama\]**   *Sirve draw.io, Excalidraw o Mermaid. Si usan LangGraph, \`get\_graph().draw\_mermaid()\` lo genera del código.*

| \[completar\]  |
| :---- |

**4.2 · Stack tecnológico**

| Capa | Tecnología | Versión | Por qué la eligieron |
| :---- | :---- | :---- | :---- |
| *Ej: Backend* | *FastAPI* | *0.115* | *ya era el stack del equipo* |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**4.3 · Flujo de una petición, de principio a fin**

Numeren los pasos desde que el usuario escribe hasta que recibe la respuesta. Si en algún paso interviene el modelo, márquenlo.

**Los pasos**   *Ej: 1\) el usuario escribe en el chat → 2\) el backend valida → 3\) …*

| \[completar\]  |
| :---- |

**5 · Herramientas y niveles de integración implementados**

*El capítulo más evaluado. Completen solo las secciones que efectivamente implementaron.*

**5.1 · Modelo de lenguaje**

| Uso | Proveedor | Modelo | Por qué ese | Costo aprox. |
| :---- | :---- | :---- | :---- | :---- |
| *Ej: chat principal* | *OpenAI* | *gpt-4o-mini* | *costo/latencia aceptables* | *≈ $0,002 / consulta* |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

**¿Tienen un modelo de respaldo (fallback) si el principal falla?**   *Si no lo tienen, escriban «no» y digan qué pasa hoy cuando el proveedor se cae.*

| \[completar\]  |
| :---- |

**Parámetros relevantes**   *temperature, max\_tokens, timeout, y por qué esos valores.*

| \[completar\]  |
| :---- |

**5.2 · Publicación del código**

| Qué | Dónde | Notas |
| :---- | :---- | :---- |
| *Ej: repositorio principal* | *github.com/equipo/proyecto* | *público / rama main* |
|  |  |  |
|  |  |  |
|  |  |  |

| Requisitos del repositorio.  Debe ser accesible por el docente, tener un README que explique cómo levantarlo, y un \`.env.example\` con las variables necesarias. Las claves de API NUNCA se suben al repositorio. Si encuentran una clave commiteada en su historial, revóquenla antes de entregar. |
| :---- |

**¿Cómo se levanta el proyecto?**   *Los comandos exactos, en orden.*

| \[completar\]  |
| :---- |

**5.3 · Tooling (Nivel 2 — tool calling)**

Una «herramienta» es una función de su sistema que el modelo puede pedir que se ejecute. Listen todas las que tienen.

| Nombre de la tool | Qué hace | Lectura / Escritura | Parámetros | ¿Requiere confirmación? |
| :---- | :---- | :---- | :---- | :---- |
| *Ej: buscar\_solicitud* | *consulta el estado de una solicitud* | *lectura* | *numero\_solicitud: str* | *no* |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

| El punto que hay que responder sí o sí.  ¿Qué pasa con las herramientas de ESCRITURA? Una tool que modifica datos reales no debería ejecutarse sin confirmación explícita del usuario. Expliquen su mecanismo — y si no lo tienen, dígan lo y expliquen el riesgo que asumen. |
| :---- |

**Cómo describen las herramientas al modelo**   *La descripción de la tool ES el prompt: es lo único que el modelo lee para decidir si la usa. Peguen una descripción real suya.*

| \[completar\]  |
| :---- |

**¿Cómo saben que el modelo eligió bien la herramienta?**   *¿Lo probaron? ¿Con cuántos casos? ¿Qué pasó cuando eligió mal?*

| \[completar\]  |
| :---- |

**5.4 · RAG (Nivel 3 — recuperación aumentada)**

**¿Qué conocimiento indexaron y por qué ese?**   *Reglamentos, manuales, catálogo, historial… y de dónde salió.*

| \[completar\]  |
| :---- |

| Aspecto | Su decisión | Por qué |
| :---- | :---- | :---- |
| *Ej: tamaño de chunk* | *800 caracteres con 100 de solape* | *los artículos del reglamento no se parten a la mitad* |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

Aspectos que hay que cubrir en esa tabla: origen de los documentos, cantidad indexada, estrategia de chunking, modelo de embeddings, vector store, valor de top-k, y umbral de similitud si usan uno.

**¿Cómo citan la fuente en la respuesta?**   *Peguen un ejemplo real de respuesta con su cita.*

| \[completar\]  |
| :---- |

**¿Qué hace el sistema cuando NO encuentra la respuesta en los documentos?**   *Ésta es la pregunta importante. Si responde igual, están alucinando con más pasos.*

| \[completar\]  |
| :---- |

| Evidencia mínima para esta sección.  Una pregunta cuya respuesta esté en los documentos, y otra cuya respuesta NO esté. Muestren las dos salidas. La segunda demuestra más madurez que la primera. |
| :---- |

**5.5 · Agente \+ MCP (Nivel 4\)**

**¿Qué hace su agente que el tool calling simple no podía?**   *Si la respuesta es «lo mismo pero más lento», entonces no necesitaban un agente. Sean honestos.*

| \[completar\]  |
| :---- |

**La tool list del agente.** Listen TODAS las herramientas que el agente puede ver y usar. Si están publicadas en un servidor MCP, indíquenlo.

| Herramienta | Origen | Qué hace | Lee o escribe | ¿Vía MCP? |
| :---- | :---- | :---- | :---- | :---- |
| *Ej: buscar\_documentacion* | *RAG interno* | *recupera fragmentos con fuente* | *lee* | *sí* |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

**¿Cómo se conecta el agente con el resto del sistema?**   *Concretamente: ¿cómo llega el agente al RAG? ¿Cómo llega a la base de datos? ¿Importa las funciones directamente, o las descubre por protocolo?*

| \[completar\]  |
| :---- |

**Si publicaron un servidor MCP, completen esto:** 

| Dato | Valor |
| :---- | :---- |
| *Ej: transporte* | *stdio (proceso hijo)* |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |

Datos a completar: nombre del servidor, transporte (stdio o HTTP), cuántas herramientas publica, qué clientes lo consumen, y si el cliente las descubre con \`tools/list\` o están escritas a mano.

**Control del bucle del agente**   *¿Cuál es el tope de pasos? ¿Qué pasa si lo alcanza? Un bucle sin tope es una fuga de presupuesto.*

| \[completar\]  |
| :---- |

**Traza del agente**   *¿Registran qué herramienta pidió, qué devolvió y cuántos tokens gastó? ¿Dónde se ve esa traza?*

| \[completar\]  |
| :---- |

| La demostración que se pide para este nivel.  Una pregunta que obligue al agente a encadenar al menos DOS herramientas distintas, con la traza visible. Si todas sus preguntas se resuelven con una sola herramienta, están en Nivel 2, no en Nivel 4 — y decirlo es preferible a exagerar. |
| :---- |

**6 · Orquestación (Nivel 5\) — capítulo opcional**

| Quién completa este capítulo.  Solo los equipos que alcanzaron a implementar orquestación. Si no llegaron, borren el capítulo entero y díganlo en una línea en el capítulo 8 (trabajo futuro). No pasa nada: el Nivel 5 no es obligatorio para todos los casos. |
| :---- |

**Recordatorio de qué es orquestar:** decidir QUÉ se ejecuta, EN QUÉ ORDEN, CON QUÉ DATOS, y QUÉ PASA CUANDO ALGO FALLA. Encadenar llamadas una detrás de otra no es orquestar: eso es un pipeline. La orquestación empieza cuando hay ramas, ciclos y estado que sobrevive.

**6.1 · Qué hace su orquestador**

**Descripción del flujo orquestado**   *En una frase primero, y después el detalle.*

| \[completar\]  |
| :---- |

Listen los pasos o nodos de su flujo y qué hace cada uno:

| Paso / nodo | Qué hace | Qué datos lee | Qué datos escribe |
| :---- | :---- | :---- | :---- |
| *Ej: clasificar* | *determina la intención* | *la pregunta del usuario* | *intencion, urgencia* |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**6.2 · Las decisiones del flujo (ramas)**

Aquí está lo que de verdad se evalúa: los puntos donde el flujo se bifurca, y con qué criterio. Una buena rama es una regla de NEGOCIO, no una regla técnica.

| Punto de decisión | Condición | Camino A | Camino B |
| :---- | :---- | :---- | :---- |
| *Ej: después de clasificar* | *urgencia \== alta* | *escalar a un humano* | *continuar el flujo normal* |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

| La diferencia que hay que entender.  «Si falla la API, reintenta» es una regla TÉCNICA. «Si es un caso especial, va a Secretaría» es una regla de NEGOCIO — y esa es la que justifica la orquestación. Si todas sus ramas son técnicas, probablemente no necesitaban un orquestador. |
| :---- |

**6.3 · Cómo comprende la intención del usuario**

Este es el punto de entrada de todo el flujo: si la intención se detecta mal, todo lo que sigue va por el camino equivocado.

**¿Cómo detectan la intención?**   *¿Con el modelo? ¿Con reglas? ¿Con una mezcla? Sean precisos.*

| \[completar\]  |
| :---- |

Listen las intenciones que su sistema reconoce y a dónde lleva cada una:

| Intención | Ejemplo de frase del usuario | A dónde la lleva el flujo |
| :---- | :---- | :---- |
| *Ej: consulta\_estado* | *«¿en qué va mi solicitud?»* | *nodo consultar\_sistema* |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**¿En qué formato devuelve la intención el modelo?**   *Si devuelve texto libre, ¿cómo lo convierten en una decisión? Si devuelve JSON, ¿lo validan?*

| \[completar\]  |
| :---- |

**¿Qué pasa cuando NO reconoce la intención, o se equivoca?**   *¿Hay una intención «otro»? ¿Pregunta de nuevo? ¿Escala? Un clasificador sin plan B rompe el flujo completo.*

| \[completar\]  |
| :---- |

**¿Lo midieron?**   *¿Probaron con cuántas frases reales? ¿Cuántas clasificó bien? Un número, aunque sea pequeño, vale más que una afirmación.*

| \[completar\]  |
| :---- |

**6.4 · Estado y persistencia**

**¿Qué guarda el estado del flujo?**   *Los campos concretos.*

| \[completar\]  |
| :---- |

**¿El estado sobrevive si se reinicia el proceso?**   *Si sí: ¿dónde se guarda y bajo qué identificador? Si no: díganlo, es una limitación válida para declarar.*

| \[completar\]  |
| :---- |

**7 · Evidencias**

**Regla:** cada capacidad que afirmaron en el capítulo 5 necesita al menos una evidencia aquí. Las capturas deben estar anotadas — una flecha o un recuadro señalando qué hay que mirar. Una captura sin anotar obliga al lector a adivinar.

| Capacidad afirmada | Evidencia | Dónde está |
| :---- | :---- | :---- |
| *Ej: el RAG cita la fuente* | *captura de la respuesta con el artículo citado* | *Anexo A, figura 3* |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**\[Insertar capturas, trazas o fragmentos de código\]**   *Cada una con un pie que diga qué demuestra.*

| \[completar\]  |
| :---- |

**8 · Conclusiones y trabajo futuro**

**Qué funciona hoy**

| \[completar\]  |
| :---- |

**Qué NO funciona todavía, y por qué**   *Esta sección suma puntos. Reconocer un límite con precisión demuestra que entienden el sistema.*

| \[completar\]  |
| :---- |

**Qué aprendieron que no esperaban**   *Algo técnico y concreto, no una reflexión genérica.*

| \[completar\]  |
| :---- |

**Trabajo futuro**   *Priorizado: qué harían primero si tuvieran dos semanas más.*

| \[completar\]  |
| :---- |

**Checklist antes de entregar**

Revisen esto con el documento terminado. Cada punto es algo que se mira al evaluar.

* No quedó ningún \[corchete\] sin reemplazar en el documento.  
* Se borraron todas las cajas de instrucciones y las filas de ejemplo en gris.  
* El índice está actualizado (clic derecho → Actualizar campos).  
* El enlace al repositorio abre y el README explica cómo levantar el proyecto.  
* No hay ninguna clave de API en el repositorio ni en este documento.  
* Cada capacidad afirmada en el capítulo 5 tiene su evidencia en el capítulo 7\.  
* Las capturas están anotadas: se ve qué hay que mirar.  
* El nivel de la escalera declarado coincide con lo que realmente se demuestra.  
* Está justificado por qué ese nivel y no otro.  
* Lo que no se implementó está dicho explícitamente, no escondido.  
* El resumen se escribió al final y se puede leer solo.

| Y la pregunta con la que conviene cerrar la revisión.  «Si alguien lee solo este documento, sin vernos presentar, ¿entiende qué hace nuestro sistema y qué parte de eso es inteligencia artificial?» Si la respuesta es no, falta trabajo de redacción, no de código. |
| :---- |

[image1]: <data:image/png;base64,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>