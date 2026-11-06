# E3 · Hipótesis: Monolito modular frente a servicio extraído (Módulo de Reportes)

> Documento registrado **antes de la primera corrida** de mediciones.
> Fecha: 6 de noviembre de 2026.
> Repositorio: https://github.com/ActFijos/Activa360

- **Grupo:** Equipo Activa360 (Guillermo Omar Daza Alcalá, Josefina Rojas, Rita Nina)
- **Módulo que se compara:** Módulo de Reportes y Estadísticas Patrimoniales (`reports`)
- **Ruta que lo usa:** `GET /activos/reportes/estadisticas`
- **Ruta de control (no lo usa):** `GET /activos`
- **Fecha y commit en que se escriben:** 6 de noviembre de 2026 (Commit inicial de la rama `feature/e3-monolito-vs-extraido`)

---

## Tabla de Hipótesis Refutables

| # | Qué se compara (forma, ruta, fase) | Qué esperamos y cuánto | Por qué (mecanismo) | Qué número la refuta |
|---|---|---|---|---|
| **H1** | **Sobrecosto de red en estado estable:** Forma en proceso vs. Extraído en `GET /activos/reportes/estadisticas` (fase `antes`). | Extraer el módulo aumentará el p95 de latencia entre **8 ms y 25 ms**. | El salto TCP adicional a través de Toxiproxy, la serialización/deserialización JSON por HTTP y el context switching de red del kernel introducen latencia inexistente en llamada directa en memoria. | Si la diferencia de medianas `p95(extraído) - p95(proceso)` es **menor a 5 ms** o **mayor a 35 ms**. |
| **H2** | **Aislamiento de la ruta de control durante la falla:** `GET /activos` en fase `falla` (con reportes caído/colgado) vs. fase `antes`. | El p95 de `GET /activos` variará **menos de 5 ms** y tendrá **0.0% de errores** en ambas formas. | La ruta de control no depende del módulo de reportes; además, en la forma extraída, el Circuit Breaker (Opossum) aísla la falla y evita la saturación del event loop / pool de conexiones de la API. | Si `GET /activos` presenta **más de 0.5% de errores** o si su p95 aumenta **más de 10 ms** durante la falla. |
| **H3** | **Comportamiento fail-fast del Circuit Breaker:** `GET /activos/reportes/estadisticas` en fase `falla` (forma extraída). | Una vez abierto el circuito, el p95 de las llamadas rechazadas será **menor a 10 ms** con respuestas 503 controladas. | Opossum en estado `OPEN` rechaza inmediatamente las peticiones sin agotar el timeout de red por intento (300 ms), evitando que los clientes queden colgados. | Si el p95 en la fase `falla` supera los **50 ms** (lo que evidenciaría que el breaker no abrió o sigue esperando timeouts). |
| **H4** | **Sobrecosto de arranque y orquestación:** Tiempo de `docker compose up -d --wait` entre ambas formas. | La forma extraída tardará entre **4 y 12 segundos más** en arrancar y pasar los healthchecks que la forma en proceso. | La forma extraída requiere instanciar e inicializar tres contenedores coordinados (`api`, `reports-service`, `toxiproxy`) con healthchecks encadenados vía `depends_on`. | Si la diferencia de tiempo de arranque `up(extraído) - up(proceso)` es **menor a 2 segundos**. |
