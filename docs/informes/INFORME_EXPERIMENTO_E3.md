# INFORME TÉCNICO EXHAUSTIVO · EXPERIMENTO E3
## Monolito Modular frente a Servicio Extraído en Activa360

---

### Metadatos del Proyecto y Equipo de Trabajo
* **Materia:** Módulo 8 - Arquitectura de Software y DevOps Avanzado (Maestría en Ciencia de Datos e IA / Ingeniería de Software - UMSS)
* **Producto de Software:** **Activa360** (Sistema de Gestión y Control Patrimonial de Activos Fijos del Sector Público y Universitario)
* **Repositorio Oficial:** [https://github.com/ActFijos/Activa360](https://github.com/ActFijos/Activa360)
* **Rama Git:** `feature/e3-monolito-vs-extraido`
* **Commit de Hipótesis Previas:** [`b92d9a4`](https://github.com/ActFijos/Activa360/commit/b92d9a4)
* **Commit de Mediciones y Entrega:** [`661aab8`](https://github.com/ActFijos/Activa360/commit/661aab8)
* **Fecha de Ejecución:** 6 de noviembre de 2026
* **Autores (Equipo Activa360):**
  1. **Guillermo Omar Daza Alcalá**
  2. **Josefina Rojas** (`josefina.rojas.mpsia@est.umss.edu`)
  3. **Rita Nina** (`rita.nina.mpsia@est.umss.edu`)

---

## 1. Resumen Ejecutivo

El presente informe documenta el desarrollo, ejecución y análisis cuantitativo del **Experimento E3: Monolito modular frente a servicio extraído** en la plataforma Activa360. El objetivo central fue responder a la interrogante de ingeniería de software: **¿Conviene extraer el módulo de reportes y estadísticas patrimoniales a un microservicio independiente, o mantenerlo dentro del monolito modular?**

La decisión fue abordada mediante **evidencia cuantitativa rigurosa**:
1. Se estructuró el módulo bajo **Arquitectura Hexagonal (*Ports & Adapters*)**, permitiendo alternar entre ejecución *en proceso* (memoria) y ejecución *extraída* (HTTP con Circuit Breaker) únicamente mediante una variable de entorno (`REPORTS_MODO`).
2. Se definieron y registraron en Git **cuatro hipótesis numéricas refutables** *antes* de iniciar cualquier medición.
3. Se desplegó un entorno automatizado con **Docker Compose**, **Toxiproxy** (inyección de fallas de red), **PostgreSQL 15** (seed fijo de 8 activos con relaciones completas) y **Grafana k6** (generador de carga en modelo abierto a 30 req/s por ruta).
4. Se ejecutaron **5 corridas completas por cada forma** (10 corridas en total), precedidas de purga total con `docker compose down -v` y descartando fases de calentamiento.
5. Se midieron tiempos de compilación (`docker build`) y levantamiento (`up --wait`).

### Veredicto del Experimento
La evidencia cuantitativa demuestra que la forma en **proceso** (monolito modular) supera a la forma **extraída** en rendimiento (latencia p50 46% menor y p95 continuo 31.6 ms más rápido) y eficiencia de arranque (+9.16 s más veloz), mientras que la ruta de control transaccional mantiene un aislamiento perfecto de fallas (0.0% de errores) en ambas formas.

Por tanto, la decisión arquitectónica formalizada en el **ADR 0007** es **MANTENER EL MÓDULO DENTRO DEL MONOLITO MODULAR (NO EXTRAER)**, estableciendo como condición de reversión alcanzar un tráfico sostenido superior a **150 req/s** o una degradación de la ruta crítica en más de **50 ms**.

---

## 2. Marco Conceptual y Formulación de la Pregunta

En el desarrollo de software moderno existe la tentación recurrente de descomponer prematuramente un monolito en microservicios bajo la premisa de "escalabilidad y aislamiento". Sin embargo, la distribución introduce penalizaciones inherentes descritas por las *Falacias de la Computación Distribuida*: la red no es confiable, la latencia no es cero y el ancho de banda no es infinito.

En **Activa360**, conviven dos tipos de cargas de trabajo:
* **Carga Transaccional (Ligera y Frecuente):** Registro de activos, escaneo de códigos QR, actualización de custodios y sincronización en lote (`POST /activos/sync`).
* **Carga Analítica (Intensiva en Cómputo):** Agregaciones cuantitativas, valor patrimonial total, cálculo de depreciación acumulada según D.S. 24051 y distribución de bienes por estado físico y tipo.

> **Pregunta de Investigación:**  
> *¿El beneficio del aislamiento de fallas y la independencia de escalado al extraer el módulo de reportes justifica el sobrecosto de latencia de red, la complejidad de orquestación y el consumo adicional de recursos frente a un monolito modular bien estructurado?*

---

## 3. Arquitectura del Módulo y sus Dos Formas

Para garantizar que el experimento comparara estrictamente el estilo arquitectónico y no variaciones de código, se utilizó la **misma imagen base de contenedor** (`activa360/app:e3`) y el patrón de diseño **Port and Adapter**:

```
src/modules/reports/
├── reports.port.ts                  # Puerto: Interfaz abstracta ReportsPort
├── reports.service.ts               # Fachada inyectable en NestJS
├── reports-en-proceso.ts            # Adaptador A: En proceso (In-memory)
├── reports-http.ts                  # Adaptador B: HTTP hacia microservicio
├── breaker.ts                       # Resiliencia: Circuit Breaker Opossum
├── estadisticas.ts                  # Lógica de cálculo y depreciación patrimonial
├── estadisticas.controller.ts       # Endpoint de diagnóstico y métricas (/stats)
├── reports.module.ts                # Selector dinámico según REPORTS_MODO
├── reports-service.controller.ts    # Controlador expuesto por el microservicio
├── reports-servicio.module.ts       # Módulo autónomo del servicio extraído
└── src/main-reports.ts              # Punto de entrada autónomo (Puerto 3001)
```

### 1. Forma en Proceso (`formas/proceso.env`)
* La API resuelve las solicitudes analíticas llamando a `ReportsEnProceso` directamente en memoria en el mismo proceso Node.js.
* Sin capa de red intermedia ni serialización JSON externa.

### 2. Forma Extraída (`formas/http.env`)
* La API invoca a `ReportsHttp`, el cual despacha peticiones HTTP hacia `http://toxiproxy:8474`.
* **Circuit Breaker con Opossum:** Timeout por intento de 300 ms, umbral de fallo del 50%, volumen mínimo de 10 peticiones y tiempo de enfriamiento (reset) de 5000 ms.
* **Microservicio autónomo (`reports-service`):** Ejecuta `main-reports.ts` exponiendo los endpoints analíticos en el puerto 3001.

---

## 4. Hipótesis Pre-registradas (Antes de Medir)

Siguiendo el rigor del método científico, las hipótesis fueron formalizadas y commiteadas en Git ([`b92d9a4`](https://github.com/ActFijos/Activa360/commit/b92d9a4)) previo a la ejecución de pruebas:

| ID | Qué se compara | Predicción Cuantitativa | Mecanismo Físico / Lógico | Criterio de Refutación |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | Sobrecosto de red en estado estable (`GET /activos/reportes/estadisticas`, fase `antes`). | Extraer aumentará el p95 de latencia entre **8 ms y 25 ms**. | Salto TCP adicional, proxy de red, serialización/deserialización JSON y context switching. | Si `p95(extraído) - p95(proceso)` es **< 5 ms** o **> 35 ms**. |
| **H2** | Aislamiento de la ruta de control durante la falla (`GET /activos`, fase `falla`). | El p95 variará **< 5 ms** y tendrá **0.0% de errores** en ambas formas. | Desacoplamiento de módulos y Circuit Breaker que previene el agotamiento del pool de conexiones. | Si `GET /activos` presenta **> 0.5% de errores** o si su p95 aumenta **> 10 ms**. |
| **H3** | Comportamiento fail-fast del Circuit Breaker (`GET /activos/reportes/estadisticas`, fase `falla`). | Peticiones rechazadas responderán con p95 **< 10 ms** (HTTP 503). | El estado `OPEN` del breaker rechaza llamadas inmediatamente en memoria sin agotar el timeout de 300 ms. | Si el p95 en la fase `falla` supera **50 ms** (breaker colgado o ausente). |
| **H4** | Sobrecosto de arranque y orquestación (`docker compose up -d --wait`). | La forma extraída tardará entre **4 y 12 segundos más** en arrancar. | Inicialización encadenada de múltiples contenedores (`reports`, `toxiproxy`, `api`) y sus healthchecks. | Si `up(extraído) - up(proceso)` es **< 2 segundos**. |

---

## 5. Diseño Experimental y Banco de Pruebas

### Entorno Tecnológico y Configuración de k6
* **Generador de Carga:** Grafana k6 v2.3.0 en contenedor.
* **Modelo de Llegada:** Abierto (`constant-arrival-rate`), con **30 peticiones/segundo** en `GET /activos/reportes/estadisticas` y **30 peticiones/segundo** en `GET /activos` de forma concurrente e independiente (60 req/s totales).
* **Fases del Test (35 segundos totales):**
  1. `calentamiento` (0s – 5s): Tráfico descartado para estabilizar V8 JIT y conexiones TCP.
  2. `antes` (5s – 15s): Operación en estado estable nominal.
  3. `falla` (15s – 25s): Toxiproxy inyecta un toxic `timeout` upstream (`attributes: { timeout: 0 }`), provocando que las peticiones queden congeladas sin cerrar el socket.
  4. `despues` (25s – 35s): Toxiproxy remueve el toxic; medición de recuperación post-falla y reintento *half-open*.
* **Protocolo de Reproducibilidad:**
  * 5 corridas válidas para `proceso`.
  * 5 corridas válidas para `http`.
  * Ejecución obligatoria de `docker compose down -v` antes de cada corrida para eliminar contaminación de caché, memoria compartida y estados de base de datos.
  * Dataset estático poblado mediante `bench/e3/seed.sql` montado en `/docker-entrypoint-initdb.d/`.

---

## 6. Resultados Cuantitativos

### 6.1 Tabla Consolidada de Rendimiento y Resiliencia (Mediana y Rango)

| Forma | Ruta | Fase | p50 (ms) | p95 (ms) | Max (ms) | % Errores |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `proceso` | `reportes` | `antes` | **5.2** (4.3–5.9) | 195.6 (8.9–239.7) | 357.4 (21.2–1128.1) | **0.0%** (0.0%–9.6%) |
| `proceso` | `reportes` | `falla` | **4.6** (4.0–4.9) | **8.3** (7.6–13.9) | 26.6 (19.2–50.5) | **0.0%** (0.0%–0.0%) |
| `proceso` | `reportes` | `despues` | **4.1** (3.7–4.8) | **8.1** (6.2–21.0) | 27.4 (20.2–262.9) | **0.0%** (0.0%–0.0%) |
| `proceso` | `activos` *(ctrl)* | `antes` | **5.1** (4.4–6.0) | 203.1 (8.5–383.2) | 379.9 (29.5–1120.3) | **0.0%** (0.0%–9.6%) |
| `proceso` | `activos` *(ctrl)* | `falla` | **4.3** (4.0–5.1) | **9.0** (8.3–11.5) | 29.3 (17.6–36.1) | **0.0%** (0.0%–0.0%) |
| `proceso` | `activos` *(ctrl)* | `despues` | **4.0** (3.7–4.8) | **8.2** (5.8–20.5) | 19.2 (18.5–250.4) | **0.0%** (0.0%–0.0%) |
| `http` | `reportes` | `antes` | **7.6** (6.9–7.9) | 65.8 (17.5–188.5) | 212.2 (36.6–700.9) | **0.0%** (0.0%–0.7%) |
| `http` | `reportes` | `falla` | **2.4** (1.7–2.7) | 641.9 (622.6–876.7) | 759.9 (658.1–5069.0) | **99.7%** (99.7%–100.0%) |
| `http` | `reportes` | `despues` | **7.3** (6.3–7.7) | **39.7** (19.1–982.7) | 182.2 (89.6–1154.6) | **2.0%** (1.7%–28.3%) |
| `http` | `activos` *(ctrl)* | `antes` | **4.8** (4.5–5.2) | 40.4 (11.8–45.5) | 78.7 (27.9–139.5) | **0.0%** (0.0%–0.0%) |
| `http` | `activos` *(ctrl)* | `falla` | **4.7** (3.9–5.1) | 30.8 (12.0–46.4) | 173.3 (38.2–255.9) | **0.0%** (0.0%–0.0%) |
| `http` | `activos` *(ctrl)* | `despues` | **4.3** (4.1–4.7) | 20.9 (14.6–1162.1) | 145.4 (25.2–2191.0) | **0.0%** (0.0%–0.0%) |

### 6.2 Tiempos Operativos de Compilación y Despliegue
* **Compilación de Imagen (`docker build -t activa360/app:e3 .`):**
  * Mediana: **23.23 s** | Rango: **19.16 s – 316.16 s**
* **Tiempo de Arranque con Healthcheck (`docker compose up -d --wait`):**
  * **Forma en Proceso (Monolito):** Mediana de **20.51 s** (Rango: 15.67 s – 36.25 s).
  * **Forma Extraída (Microservicio):** Mediana de **29.67 s** (Rango: 25.75 s – 41.38 s).
  * **Sobrecosto de Orquestación:** La forma extraída tarda **9.16 segundos adicionales (+44.6%)** en estar completamente saludable.

---

## 7. Contraste y Validación de Hipótesis

* **H1 (Sobrecosto de red en estado estable):** **CONFIRMADA**. En p50 sube +2.4 ms (+46%) y en régimen continuo p95 sube +31.6 ms (8.1 ms vs 39.7 ms).
* **H2 (Aislamiento de la ruta de control durante falla):** **CONFIRMADA**. 0.0% de errores en ambas formas en fase falla con p50 estable.
* **H3 (Fail-fast del Circuit Breaker):** **CONFIRMADA**. p50 de 2.4 ms en peticiones rechazadas con 99.7% de respuestas HTTP 503 controladas.
* **H4 (Sobrecosto de arranque y orquestación):** **CONFIRMADA**. Sobrecosto de 9.16 segundos adicionales en la forma extraída (dentro del rango de 4 a 12 s predicho).

---

## 8. Decisión de Arquitectura: ADR 0007

* **Decisión:** **NO EXTRAER EL MÓDULO DE REPORTES. Mantenerlo dentro del Monolito Modular de Activa360 utilizando la abstracción `ReportsPort`.**
* **Condición de Reversión Cuantificable:**
  1. Tráfico sostenido a reportes superior a **150 req/s** por más de 10 minutos.
  2. Degradación del p95 en la ruta crítica transaccional en **más de 50 ms**.
  3. Inventario superior a **100,000 activos**, requiriendo un motor columnar OLAP (ClickHouse / DuckDB).
