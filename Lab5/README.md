# Lab5 — Nivel 4: Agente + MCP · Día 6

> Hasta ayer, **nosotros** decidíamos el flujo: una llamada, una herramienta,
> una respuesta. Hoy el flujo lo decide el **modelo**: piensa → actúa →
> observa → repite, hasta resolver. Y las herramientas dejan de vivir dentro
> del agente: se publican en un **servidor MCP** que cualquier cliente puede
> descubrir.

Continúa el Lab4 del Día 5. Dos variantes del mismo laboratorio:

| Carpeta      | Agente                           | Embeddings por defecto            |
|--------------|----------------------------------|-----------------------------------|
| `chatgpt/`   | OpenAI `gpt-4o-mini`             | `text-embedding-3-small` (de pago)|
| `localhost/` | Ollama `llama3.2:3b` (soporta tools) | `all-MiniLM-L6-v2` de Chroma (gratis) |

---

## ⚠️ Lo primero que hay que entender

**Un agente no es un modelo más inteligente: es un `while` alrededor del
mismo modelo del Día 4.** La única novedad del bucle es quién decide:

- **Día 4 (tool calling):** el programa decide *cuándo* preguntar y *qué*
  herramienta ofrecer. Un paso y afuera.
- **Día 6 (agente):** el modelo decide *cuántos pasos* dar y *en qué orden*
  usar las herramientas. Nosotros solo ejecutamos, devolvemos y **cortamos
  a tiempo** (`MAX_PASOS`).

Y la segunda novedad es **dónde viven las herramientas**:

- **Fases 1–2:** dentro del agente (`import herramientas`). Funciona, pero
  cada nuevo cliente tendría que copiar el código.
- **Fases 3–6:** en un **servidor MCP**. El agente las *descubre* por el
  protocolo. El mismo servidor sirve para otro agente, para un IDE o para
  Claude Desktop, sin tocar la lógica.

Frase para recordar: **MCP es el USB-C de las herramientas de IA.**

---

## Mapa de archivos

```
Lab5/
├── base_conocimiento/          <- los .md de SoporteIA (mismos del Lab4)
├── datos/
│   ├── pedidos.json            <- el "sistema de pedidos" (se modifica al cancelar)
│   └── tickets.json            <- se genera al crear tickets
├── localhost/  ó  chatgpt/
│   ├── config.py               <- lo único que cambia entre variantes
│   ├── rag.py                  <- la herramienta RAG (hereda el índice del Día 5)
│   ├── herramientas.py         <- 4 tools reales + schemas + despachador
│   ├── agente.py               <- EL BUCLE ReAct (pensar→actuar→observar)
│   ├── servidor_mcp.py         <- publica las 4 tools por MCP (stdio)
│   ├── cliente_mcp.py          <- descubre tools MCP y las traduce a OpenAI
│   ├── fase1_bucle_agente.py   <- el bucle con tools locales
│   ├── fase2_multipaso.py      <- la pregunta que encadena 3 herramientas
│   ├── fase3_servidor_mcp.py   <- mirar el servidor por dentro
│   ├── fase4_cliente_mcp.py    <- descubrir y llamar tools SIN modelo
│   ├── fase5_agente_mcp.py     <- agente + MCP: el mismo bucle, otro enchufe
│   ├── fase6_endpoint.py       <- entregable: POST /agente con traza
│   └── verificar_entorno.py    (solo localhost/)
└── db_localhost/ ó db_chatgpt/ <- índice Chroma (se reconstruye solo si falta)
```

---

## Cómo ejecutar

```bash
cd Lab5
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # y completa tus valores

# Variables que reconoce cada variante:
# chatgpt/   -> CHATGPT_API_KEY, CHATGPT_MODEL, CHATGPT_EMBED_BACKEND
# localhost/ -> LOCALIA_BASE_URL, LOCALIA_API_KEY, LOCALIA_MODEL,
#               LOCALHOST_EMBED_BACKEND

# Variante local (gratis)
cd localhost
python verificar_entorno.py      # *
python fase1_bucle_agente.py
python fase2_multipaso.py
python fase3_servidor_mcp.py
python fase4_cliente_mcp.py
python fase5_agente_mcp.py
uvicorn fase6_endpoint:app --reload    # http://127.0.0.1:8000/docs

# Variante de pago
cd ../chatgpt
python fase1_bucle_agente.py           # ... mismas fases
```

La demo estrella del día (fase 2 y fase 5):

> «Cancela el pedido PED-2026-0117 si la política todavía lo permite.»

El agente encadena solo: `buscar_pedido` (estado) → `buscar_documentacion`
(política de cancelaciones) → `cancelar_pedido` (muestra el plan y **espera
tu "sí"**). Nadie programó ese orden.

Ramas para probar el criterio del agente:

| Pregunta | Qué debe pasar |
|----------|----------------|
| `Cancela el pedido PED-2026-0203` | Está DESPACHADO → la política lo impide; ofrece devolución o ticket |
| `Cancela el pedido PED-9999-0000` | No existe → lo dice, no inventa |
| `cuántos días tengo para devolver electrónicos?` | 1 solo paso de RAG → **no** necesita ser agente |

---

## Las tres perillas que hay que saber mover

| Perilla | Qué pasa si la subes | Qué pasa si la bajas |
|---------|----------------------|----------------------|
| `MAX_PASOS` (6) | El agente resuelve tareas más largas, pero un bucle perdido quema más tokens | Corta tareas legítimas a la mitad |
| Nº de herramientas | Más capacidades, pero el modelo elige peor y el prompt crece (todas las tools viajan en cada llamada) | Elige mejor, pero se queda corto |
| Descripción de cada tool | — | — la descripción **es** el prompt: de ella depende que el modelo elija bien. Escribirla es escribir código. |

Regla práctica: pocas herramientas, bien descritas, con tope de pasos.

---

## ¿Tool calling (Día 4), RAG (Día 5) o Agente (Día 6)?

| Si la tarea necesita… | Nivel | Ejemplo |
|-----------------------|-------|---------|
| Un dato vivo, un paso | **Tool calling** | «¿Estado del PED-2026-0117?» |
| Conocimiento escrito, un paso | **RAG** | «¿Cuántos días para devolver?» |
| **Encadenar** datos + reglas + acción, con ramas | **Agente** | «Cancela mi pedido *si la política lo permite*» |

**Cuándo NO usar un agente:** si la tarea es una sola respuesta o un `if`,
usa Nivel 0–3. El agente se justifica con ramificación real y estado.
Un agente innecesario es más costo, más latencia y más superficie de fallo.

---

## Guardrails del día (no negociables)

1. **`MAX_PASOS`**: todo bucle de agente tiene tope. Sin tope no es un
   agente, es una fuga de dinero.
2. **Confirmación de escritura**: `cancelar_pedido` y `crear_ticket` no
   ejecutan sin `confirmado=true`, y el "sí" lo da el humano, no el modelo.
   El guardrail vive EN la herramienta (viaja con ella por MCP), no en el
   prompt.
3. **Traza**: cada paso queda registrado (acción, observación, tokens).
   `POST /agente` devuelve la traza completa: sin ella no hay depuración
   ni auditoría.

---

## Definition of Done (diapositiva)

- [x] Bucle ReAct con tope de pasos funcionando
- [x] Pregunta multipaso resuelta encadenando ≥2 herramientas
- [x] Las 4 herramientas publicadas en un servidor MCP propio
- [x] Cliente que descubre las tools por protocolo (sin import)
- [x] Escritura solo con confirmación explícita
- [x] `POST /agente` devuelve respuesta + traza de pasos

---

## Lo que NO hacemos hoy (queda para los Días 7–8)

- Grafo de estados explícito, checkpoints y reanudación (LangGraph).
- Human-in-the-loop persistente (aprobar desde otra sesión).
- Fallbacks entre modelos y caché semántica.
- Instrumentación con Langfuse.

Hoy el estado vive en la lista `mensajes` y muere con el proceso. Esa
limitación es, exactamente, el argumento de venta del Día 7.

---

*M.Sc. Luis Marcelo Garay Choqueribe · Maestría en Desarrollo de Productos de
Software con IA · FCYT–UMSS · 2026*
