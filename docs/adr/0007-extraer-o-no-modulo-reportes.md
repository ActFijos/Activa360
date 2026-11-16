# ADR 0007: Decisión de Mantener el Módulo de Reportes dentro del Monolito Modular (No Extraer)

## Estado
**Aceptada**

## Fecha
6 de noviembre de 2026

## Autores
- Guillermo Omar Daza Alcalá
- Josefina Rojas (`josefina.rojas.mpsia@est.umss.edu`)
- Rita Nina (`rita.nina.mpsia@est.umss.edu`)

---

## Contexto

El sistema Activa360 gestiona activos fijos institucionales bajo normativas bolivianas (D.S. 24051 y D.S. 0181 SABS). La carga de trabajo principal consiste en operaciones transaccionales frecuentes y livianas: registro de activos, escaneo de códigos QR, actualización de custodios y sincronización offline (`POST /activos/sync`). Adicionalmente, el sistema provee un módulo de **Reportes y Estadísticas Patrimoniales** que ejecuta agregaciones cuantitativas sobre los activos (valor patrimonial total, depreciaciones acumuladas, distribución por estado físico y tipo de bien).

Surgió la interrogante arquitectónica de si convenía **extraer el módulo de reportes a un microservicio independiente** (comunicado vía HTTP) o mantenerlo como un **módulo acoplado en proceso dentro del monolito modular** de NestJS.

Para evitar debates basados en opiniones o dogmas de microservicios, se ejecutó el **Experimento E3**, midiendo bajo condiciones idénticas de carga (k6 a 30 req/s por ruta en modelo abierto) y fallo forzado (Toxiproxy inyectando colgado upstream):
1. Latencia p50, p95 y máxima en estado normal (`antes`), durante la falla (`falla`) y tras la recuperación (`despues`).
2. Tasa de errores en la ruta bajo prueba (`GET /activos/reportes/estadisticas`) y en la ruta de control (`GET /activos`).
3. Tiempos operativos de construcción de imagen (`docker build`) y arranque orquestado con healthcheck (`docker compose up -d --wait`).

Los resultados detallados de 5 corridas con purga completa de volúmenes se encuentran documentados en [`bench/e3/INFORME.md`](../../bench/e3/INFORME.md).

---

## Decisión

Se decide **NO EXTRAER** el módulo de reportes a un servicio independiente, manteniéndolo como un módulo en proceso dentro del **Monolito Modular** de Activa360.

La frontera arquitectónica se mantendrá estrictamente desacoplada a través del puerto abstracto `ReportsPort` y el patrón *Port and Adapter* (Hexagonal). Esto preserva la modularidad lógica y permite cambiar la implementación de `ReportsEnProceso` a `ReportsHttp` en el futuro mediante configuración de entorno (`REPORTS_MODO`), sin alterar la capa de dominio ni los controladores de inventario.

---

## Sustentación Cuantitativa y Evidencia

La decisión se fundamenta en los hallazgos empíricos del Experimento E3:

1. **Penalización de Latencia Innecesaria (Sobrecosto de Red):**
   - En régimen continuo (`fase despues`), la llamada en proceso dentro del monolito resuelve el cálculo analítico con un p95 de **8.1 ms**, mientras que la versión extraída alcanza un p95 de **39.7 ms** (sobrecosto de **+31.6 ms**). En p50 en estado normal, la latencia base aumenta de **5.2 ms** a **7.6 ms** (+46%) debido a la serialización JSON, la negociación HTTP y el doble salto de red.
2. **Aislamiento y Resiliencia en el Monolito:**
   - Durante la operación normal y de estrés, la ruta de control (`GET /activos`) mantuvo **0.0% de errores (0.0%–0.0%)** y un p50 de 4.3 ms tanto en la forma en proceso como en la forma extraída. Aunque en la forma extraída el *Circuit Breaker* (Opossum) protegió exitosamente a la API frente a la caída del servicio de reportes cortando las llamadas en **2.4 ms** (fail-fast), el monolito no experimentó fallas en la ruta transaccional y eliminó por completo los errores 503 generados por la red intermedia.
3. **Sobrecosto Operativo y de Orquestación:**
   - La forma extraída requiere administrar múltiples contenedores (`api`, `reports-service`, `toxiproxy`), multiplicando el consumo de memoria base por la duplicación del runtime NodeJS (V8). Además, el tiempo de arranque orquestado con verificación de salud (`up --wait`) es de **29.67 s** en la forma extraída frente a **20.51 s** en el monolito (**+9.16 s adicionales**, +44.6% más lento) debido al encadenamiento secuencial de healthchecks.

---

## Consecuencias

### Positivas
- **Menor Latencia de Respuesta:** Respuestas analíticas más rápidas para directivos y auditores al evitar la pila de red HTTP.
- **Simplicidad de Despliegue:** Despliegue atómico de un solo artefacto contenedor, alineado con las restricciones del entorno On-Premise institucional (DTI - UMSS) y reduciendo puntos de fallo en red.
- **Eficiencia de Recursos:** Reducción del uso de CPU y memoria RAM en servidores al compartir el runtime de Node.js y el pool de conexiones Prisma/PostgreSQL.
- **Mantenibilidad:** El código del módulo reside en la misma base de código respetando la arquitectura hexagonal (`ReportsPort`), facilitando el refactor continuo y la refactorización segura con tipado estático TypeScript.

### Negativas / Riesgos Aceptados
- **Riesgo de Contención de CPU:** Cálculos analíticos masivos y no cacheados ejecutados en el mismo proceso de Node.js podrían bloquear momentáneamente el event loop si el dataset creciera exponencialmente. (Mitigado actualmente mediante paginación e índices compuestos en PostgreSQL).
- **Despliegues Acoplados:** Cualquier actualización al código de reportes requiere redeploy del contenedor de la API monolítica.

---

## Condición de Reversión

La decisión de no extraer se revertirá (activando `REPORTS_MODO=http` y desplegando el contenedor `reports-service` como microservicio autónomo) si y solo si se cumple al menos **una** de las siguientes condiciones cuantitativas medibles en producción:

1. **Volumen de Solicitudes Analíticas:**
   - El tráfico sostenido hacia `GET /activos/reportes/estadisticas` supera las **150 peticiones concurrentes por segundo (req/s)** durante más de 10 minutos continuos.
2. **Degradación de la Ruta Crítica por Contención:**
   - El p95 de latencia de la ruta de control e inventario transaccional (`GET /activos` o `POST /activos/sync`) se incrementa en **más de 50 ms** durante la generación de reportes, demostrando saturación del hilo de Node.js atribuible al cómputo analítico.
3. **Escala del Dataset Patrimonial y Cambio de Runtime:**
   - La base patrimonial institucional supera los **100,000 activos registrados**, requiriendo un motor de agregación analítica o runtime especializado (ej. Python con DuckDB/Polars o ClickHouse) con requerimientos de escalado horizontal independiente del API Gateway.

