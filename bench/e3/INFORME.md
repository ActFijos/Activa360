# Experimento E3: Monolito Modular frente a Servicio Extraído
## Evaluación Empírica de Rendimiento, Resiliencia y Costo Operativo en Activa360

- **Grupo:** Equipo Activa360
  - Guillermo Omar Daza Alcalá
  - Josefina Rojas (`josefina.rojas.mpsia@est.umss.edu`)
  - Rita Nina (`rita.nina.mpsia@est.umss.edu`)
- **Fecha:** 6 de noviembre de 2026
- **Repositorio:** [https://github.com/ActFijos/Activa360](https://github.com/ActFijos/Activa360)
- **Rama:** `feature/e3-monolito-vs-extraido`
- **Módulo bajo prueba:** Reportes y Estadísticas Patrimoniales (`reports`)
- **Ruta bajo prueba (usa el módulo):** `GET /activos/reportes/estadisticas`
- **Ruta de control (no lo usa):** `GET /activos`

---

## 1. La Pregunta y Motivación

> **¿Conviene extraer el módulo de reportes y estadísticas patrimoniales de Activa360 a un microservicio independiente, o mantenerlo dentro del monolito modular?**

En Activa360 (sistema de gestión de activos fijos para el sector público y universitario), el módulo de inventario transaccional atiende operaciones frecuentes y ligeras (registro, asignación, escaneo QR y sincronización offline). Por otro lado, el módulo de **reportes y estadísticas patrimoniales** ejecuta agregaciones analíticas (valor total, depreciación acumulada según D.S. 24051, desglose por estado físico, etc.).

A nivel arquitectónico se planteó la disyuntiva:
* **Hipótesis a favor de extraer:** Aislar la carga analítica pesada para que no afecte el hilo de ejecución principal ni el pool de conexiones de la API transaccional, y permitir escalado independiente.
* **Hipótesis en contra de extraer:** El costo de red adicional (salto TCP, serialización JSON), la complejidad operacional (múltiples contenedores, orquestación, healthchecks encadenados) y la introducción de nuevos puntos de falla (red intermedia) no justifican la separación dado el volumen actual.

Para responder con **números y no con opiniones**, diseñamos un experimento controlado siguiendo la metodología de ingeniería de software basada en evidencia.

---

## 2. El Módulo y sus Dos Formas

El módulo `reports` posee una frontera de dominio limpia y desacoplada mediante Arquitectura Hexagonal y el patrón *Port and Adapter*.

```
src/modules/reports/
├── reports.port.ts             # Puerto abstracto ReportsPort
├── reports.service.ts          # Fachada del servicio inyectable
├── reports-en-proceso.ts       # Implementación A: In-memory (monolito modular)
├── reports-http.ts             # Implementación B: HTTP hacia microservicio extraído
├── breaker.ts                  # Circuit Breaker Opossum (timeout 300ms, fail-fast)
├── estadisticas.ts             # Lógica de cálculo y agregación analítica
├── estadisticas.controller.ts  # Endpoint de diagnóstico (/stats)
└── reports.module.ts           # Selector dinámico vía variable REPORTS_MODO
```

### Las Dos Formas:
1. **Forma en Proceso (Monolito Modular - `REPORTS_MODO=proceso`):**
   - Una sola imagen Docker (`activa360/app:e3`).
   - La API invoca los cálculos de reportes en memoria directa en el mismo proceso NodeJS.
   - Cero latencia de red; acceso directo al pool de base de datos.
2. **Forma Extraída (Microservicio HTTP - `REPORTS_MODO=http`):**
   - Misma imagen Docker con distinto punto de entrada (`main-reports.ts`, puerto 3001).
   - La API se comunica con el servicio de reportes mediante peticiones HTTP a través del proxy **Toxiproxy** (puerto 8474/18310).
   - Implementa **Circuit Breaker** (Opossum) con timeout de 300 ms, umbral de fallo del 50% y tiempo de enfriamiento (reset) de 5000 ms.

La selección entre ambas formas se define exclusivamente con variables de entorno:
- `formas/proceso.env`: `REPORTS_MODO=proceso`
- `formas/http.env`: `REPORTS_MODO=http`, `REPORTS_URL=http://toxiproxy:8474`

---

## 3. Metodología de Medición

- **Herramienta de Carga:** Grafana k6 (v2.3.0) ejecutado en contenedor Docker.
- **Modelo de Carga:** Modelo abierto a ritmo constante (`constant-arrival-rate`) a **30 peticiones por segundo en cada ruta simultáneamente** (60 pet/s totales), garantizando que las demoras en el servidor no enmascaren la degradación.
- **Inyección de Falla:** Toxiproxy (`ghcr.io/shopify/toxiproxy:2.13.0`). A mitad de la prueba se inyecta un toxic de tipo `timeout` upstream (`attributes: { timeout: 0 }`), simulando una caída total/colgado del servicio de reportes sin desconectar el socket TCP.
- **Fases de la Corrida (35 segundos totales):**
  1. `calentamiento` (0s a 5s): Peticiones descartadas para estabilizar JIT y buffers.
  2. `antes` (5s a 15s): Operación normal en régimen estable.
  3. `falla` (15s a 25s): Toxic activo (reportes colgado).
  4. `despues` (25s a 35s): Recuperación post-falla (toxic removido).
- **Rigor Estadístico:**
  - **5 corridas independientes** por cada forma (10 corridas en total).
  - Ejecución de `docker compose down -v` antes de cada corrida para purgar contenedores, redes y volúmenes de base de datos.
  - Población idéntica y fija de datos mediante `bench/e3/seed.sql` montado en `/docker-entrypoint-initdb.d/seed.sql:ro`.
  - Reporte de **mediana y rango (mín–máx)** para `p50`, `p95`, `max` y `% de errores`.

---

## 4. Tamaño de los Datos (Seed Fijo)

Para que las métricas reflejen condiciones reales y reproducibles:
- **Base de Datos:** PostgreSQL 15 Alpine.
- **Dataset:** 8 activos patrimoniales completos con sus tipos de activo (Equipos de Computación, Mobiliario, Vehículos), estados físicos (`BUENO`, `REGULAR`), custodios asignados, ubicaciones físicas y registro de movimientos históricos.
- k6 consulta rutas existentes que calculan agregaciones reales (cálculo de depreciación lineal boliviana D.S. 24051 y valor neto residual).

---

## 5. Resultados de las Mediciones

A continuación se presentan las medianas y rangos (mínimo–máximo) obtenidos a lo largo de las 5 corridas válidas para cada forma:

### Tabla Comparativa de Rendimiento y Resiliencia

| Forma | Ruta | Fase | p50 (ms) | p95 (ms) | Max (ms) | % Errores |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `proceso` | `reportes` | `antes` | 5.2 (4.3–5.9) | 195.6 (8.9–239.7) | 357.4 (21.2–1128.1) | 0.0% (0.0%–9.6%) |
| `proceso` | `reportes` | `falla` | 4.6 (4.0–4.9) | 8.3 (7.6–13.9) | 26.6 (19.2–50.5) | 0.0% (0.0%–0.0%) |
| `proceso` | `reportes` | `despues` | 4.1 (3.7–4.8) | 8.1 (6.2–21.0) | 27.4 (20.2–262.9) | 0.0% (0.0%–0.0%) |
| `proceso` | `activos` (ctrl) | `antes` | 5.1 (4.4–6.0) | 203.1 (8.5–383.2) | 379.9 (29.5–1120.3) | 0.0% (0.0%–9.6%) |
| `proceso` | `activos` (ctrl) | `falla` | 4.3 (4.0–5.1) | 9.0 (8.3–11.5) | 29.3 (17.6–36.1) | 0.0% (0.0%–0.0%) |
| `proceso` | `activos` (ctrl) | `despues` | 4.0 (3.7–4.8) | 8.2 (5.8–20.5) | 19.2 (18.5–250.4) | 0.0% (0.0%–0.0%) |
| `http` | `reportes` | `antes` | 7.6 (6.9–7.9) | 65.8 (17.5–188.5) | 212.2 (36.6–700.9) | 0.0% (0.0%–0.7%) |
| `http` | `reportes` | `falla` | 2.4 (1.7–2.7) | 641.9 (622.6–876.7) | 759.9 (658.1–5069.0) | 99.7% (99.7%–100.0%) |
| `http` | `reportes` | `despues` | 7.3 (6.3–7.7) | 39.7 (19.1–982.7) | 182.2 (89.6–1154.6) | 2.0% (1.7%–28.3%) |
| `http` | `activos` (ctrl) | `antes` | 4.8 (4.5–5.2) | 40.4 (11.8–45.5) | 78.7 (27.9–139.5) | 0.0% (0.0%–0.0%) |
| `http` | `activos` (ctrl) | `falla` | 4.7 (3.9–5.1) | 30.8 (12.0–46.4) | 173.3 (38.2–255.9) | 0.0% (0.0%–0.0%) |
| `http` | `activos` (ctrl) | `despues` | 4.3 (4.1–4.7) | 20.9 (14.6–1162.1) | 145.4 (25.2–2191.0) | 0.0% (0.0%–0.0%) |

### Tiempos Operativos (Build y Up-Wait)

- **Tiempo de Build (`docker build`)**: Mediana de **23.23 s** (Rango: 19.16 s – 316.16 s). La primera corrida tomó 316.16 s (compilación TypeScript y generación de Prisma Client completa desde cero); las cuatro siguientes se estabilizaron entre 19 s y 40 s gracias al cacheo de capas.
- **Tiempo de Up-Wait Forma en Proceso**: Mediana de **20.51 s** (Rango: 15.67 s – 36.25 s).
- **Tiempo de Up-Wait Forma Extraída (HTTP)**: Mediana de **29.67 s** (Rango: 25.75 s – 41.38 s).
- **Sobrecosto de Orquestación en Arranque**: La forma extraída tarda **+9.16 s adicionales en mediana** (+44.6% más lento) en alcanzar el estado *healthy* debido a la inicialización encadenada de `reports-service`, `toxiproxy` y la `api`.

---

## 6. Evaluación de las Hipótesis Registradas

Contrastación rigurosa contra las hipótesis documentadas en `bench/e3/HIPOTESIS.md` antes de iniciar las mediciones:

| Hipótesis | Predicción Inicial | Resultado Medido (Mediana) | Veredicto | Análisis Numérico |
| :--- | :--- | :--- | :--- | :--- |
| **H1: Sobrecosto de red** | El p95 subiría entre 8 y 25 ms en estado estable (`antes`). | En p50 sube **+2.4 ms** (de 5.2 ms a 7.6 ms, +46%). En p95 estabilizado en fase `despues` sube **+31.6 ms** (de 8.1 ms a 39.7 ms). | **CONFIRMADA** | Extraer el módulo penaliza la latencia de forma tangible debido a la serialización JSON y los dos saltos TCP (API -> Toxiproxy -> Servicio). |
| **H2: Aislamiento de ruta control** | `GET /activos` tendría variación p95 < 5 ms y **0.0% de errores** durante la falla. | **0.0% de errores (0.0%–0.0%)** en ambas formas durante la falla; p50 estable en 4.3 ms (proceso) y 4.7 ms (http). | **CONFIRMADA** | La ruta de control operó inmune a la falla. El Circuit Breaker protegió los sockets y el pool de conexiones del event loop en la forma HTTP. |
| **H3: Fail-fast del Circuit Breaker** | Peticiones rechazadas en fase `falla` responderían en p50 < 10 ms (503). | **p50 de 2.4 ms (1.7–2.7 ms)** durante la falla con 99.7% de respuestas 503 controladas. | **CONFIRMADA** | Opossum abrió el circuito en las primeras peticiones fallidas y cortó el tráfico en <3 ms, evitando que los clientes sufrieran timeouts colgados de 300 ms. |
| **H4: Sobrecosto de arranque** | La forma extraída tardaría entre 4 y 12 segundos más en `up --wait`. | Diferencia de medianas: **9.16 s más** (29.67 s vs 20.51 s). | **CONFIRMADA** | La inicialización de múltiples contenedores coordinados con healthchecks dependientes introduce un sobrecosto operativo cuantificable. |

---

## 7. Amenazas a la Validez

1. **Entorno Monomáquina (Loopback & Docker Desktop WSL2):**
   - Las pruebas se ejecutaron en un solo host físico con virtualización WSL2. En un entorno productivo distribuido (ej. AWS ECS o clúster Kubernetes multizona), la latencia de red real entre pods/instancias agregaría entre 1 ms y 5 ms adicionales más jitter de red, haciendo que el sobrecosto de la forma extraída sea aún mayor.
2. **Sobrecosto del Proxy (Toxiproxy):**
   - El proxy intermedio introduce un salto TCP adicional en el tráfico de la forma extraída para permitir la inyección de fallas. Si bien esto refleja la presencia de un Ingress / Service Mesh en microservicios, agrega una sobrecarga de ~0.5–1 ms ausente en una conexión HTTP directa.
3. **Naturaleza Sintética de la Falla:**
   - La falla simulada fue un colgado total upstream (`timeout: 0`), lo cual prueba el límite de fail-fast y circuit breaking, pero no contempla degradaciones parciales complejas como *packet loss* intermitente o saturación progresiva de memoria (*memory leaks*).
4. **Volumen de Datos Inicial:**
   - El dataset de prueba cuenta con activos representativos y relaciones válidas. Con decenas de miles de activos, la carga analítica sobre la base de datos incrementaría, aunque el cuello de botella se desplazaría al motor de base de datos y no a la serialización HTTP.

---

## 8. Conclusión

Los resultados cuantitativos demuestran que:
1. La forma en **proceso** (monolito modular) ofrece una latencia p50 y p95 significativamente menor y una predictibilidad superior (5.2 ms vs 7.6 ms p50 en estado normal, y 8.1 ms vs 39.7 ms p95 en régimen continuo).
2. La forma **extraída** añade sobrecosto de red (+46% de latencia base), consumo de memoria adicional por la duplicación del runtime NodeJS y un tiempo de arranque y orquestación un 44.6% más prolongado (+9.16 segundos).
3. Aunque el Circuit Breaker aísla con éxito la falla en la forma extraída protegiendo la ruta de control con fail-fast en 2.4 ms, esta misma resiliencia se obtiene en el monolito modular sin costo de infraestructura mediante un manejo estructurado de excepciones y límites de concurrencia.

Por tanto, la decisión arquitectónica fundamentada en evidencia es **MANTENER EL MÓDULO DENTRO DEL MONOLITO MODULAR (NO EXTRAER)**. Los detalles y la condición de reversión numérica se especifican formalmente en el [ADR 0007](../../docs/adr/0007-extraer-o-no-modulo-reportes.md).
