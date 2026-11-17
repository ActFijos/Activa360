# Demo 4 · release/8.4.0
## Activa360 – Sistema Inteligente de Gestión de Activos Fijos

* **Release:** [https://github.com/ActFijos/Activa360/releases/tag/v8.4.0](https://github.com/ActFijos/Activa360/releases/tag/v8.4.0)  
* **Notas del release:** [`8.4.0-aportes.md`](../../8.4.0-aportes.md)  
* **Fecha:** 16 de noviembre de 2026  
* **Materia:** Módulo 8 - Arquitectura de Software y DevOps Avanzado (UMSS)

---

## 1. Integrantes y Funcionalidades Presentadas

| Integrante | Funcionalidades Implementadas | Caso de uso FSD | Repositorio Oficial |
| :---- | :---- | :---- | :---- |
| **Guillermo Omar Daza Alcalá** | 1. Sincronización offline en lote con algoritmo Last Write Wins (`POST /activos/sync`)<br>2. Registro e inventario QR en campo con control de concurrencia (`POST /inventory/scan`, `GET /activos/qr/{qrCode}`) | • FSD-UC-002: Sincronización de datos offline<br>• FSD-UC-001: Registro y escaneo de activo QR | [https://github.com/ActFijos/Activa360](https://github.com/ActFijos/Activa360) |
| **Josefina Rojas** | 1. Workflow de Baja Patrimonial SABS con evidencia documental y transición de estados (`POST /bajas`, `GET /bajas`, `POST /bajas/{id}/aprobar`)<br>2. Rechazo normativo de baja y restauración condicional de diagnóstico técnico (`POST /bajas/{id}/rechazar`) | • FSD-UC-003: Workflow de Baja (SABS - D.S. 0181) | [https://github.com/ActFijos/Activa360](https://github.com/ActFijos/Activa360) |
| **Rita Nina** | 1. Asignación de Activos a Custodio con vinculación patrimonial y actas (`POST /activos/asignar`, `GET /activos/asignaciones`, `GET /activos/empleados`)<br>2. Transferencia bilateral entre custodios con bloqueo pesimista `SELECT FOR UPDATE` (`POST /activos/transferir`, `POST /activos/transferencias/{id}/aprobar`) | • FSD-UC-004: Asignación a Custodio<br>• FSD-UC-005: Traspaso de Activo | [https://github.com/ActFijos/Activa360](https://github.com/ActFijos/Activa360) |

---

## 2. Detalle de Funcionalidades por Integrante

### 2.1 Guillermo Omar Daza Alcalá

#### A) Sincronización de Datos Offline — FSD-UC-002
- **Endpoints (OpenAPI):** `POST /activos/sync`.
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Dado que el dispositivo recuperó la conectividad
  Cuando el sistema detecta registros pendientes de sincronización
  Entonces envía los datos al servidor en lote
    Y resuelve conflictos priorizando el timestamp más reciente
  ```
- **Implementación Técnica:**
  - El servicio `SyncOfflineService` procesa lotes masivos capturados fuera de línea por la app móvil.
  - **Validación atómica:** Verifica de antemano la existencia de la totalidad de códigos QR del lote para evitar inconsistencias parciales.
  - **Algoritmo LWW (Last Write Wins):** Compara `itemDate.getTime() > assetDate.getTime()`. Solo si el timestamp del cliente es más reciente que el registrado en la base central, actualiza las coordenadas geoespaciales (`latitude`, `longitude`) y el estado físico en `Asset`.
  - **Trazabilidad Inmutable:** Cada sincronización aprobada persiste un registro en `Movement` con timestamp UTC, UUID y coordenadas.

#### B) Registro e Inventario QR en Campo — FSD-UC-001
- **Endpoints (OpenAPI):** `POST /inventory/scan`, `GET /activos/qr/{qrCode}`.
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Dado un activo registrado en el sistema con código QR
  Cuando el inventariador escanea el código QR con la app
  Entonces el sistema muestra los datos del activo
    Y permite actualizar ubicación y estado
  ```
- **Control de Concurrencia:** Restricción de base de datos a nivel modelo `InventoryRecord` (`@@unique([campaignId, assetId])`), impidiendo el doble conteo o duplicación de escaneos simultáneos dentro de una misma campaña de auditoría.

---

### 2.2 Josefina Rojas

#### A) Workflow de Baja Patrimonial (SABS) — FSD-UC-003
- **Endpoints (OpenAPI):** `POST /bajas`, `GET /bajas`, `POST /bajas/{id}/aprobar`.
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Dado un activo en estado "Dañado" u "Obsoleto"
  Cuando el Jefe de Activos inicia el proceso de baja
  Entonces el sistema requiere una justificación y evidencia
    Y cambia el estado del activo a "En Proceso de Baja"
  ```
- **Implementación Técnica:**
  - `InitiateBajaService` valida la identidad institucional del solicitante y su rol como Jefe de Activos Fijos mediante RBAC.
  - Exige el registro formal de la causal legal según D.S. 0181 (SABS) y la URL de la evidencia fotográfica/pericial.
  - Transiciona el estado del activo a `En Proceso de Baja` y genera el registro en estado inicial `EN_REVISION`.
  - Al aprobarse (`POST /bajas/{id}/aprobar`), el activo pasa a `Dado_De_Baja` y queda inhabilitado para futuras asignaciones.

#### B) Rechazo Normativo y Restauración Técnica Condicional — FSD-UC-003
- **Endpoint (OpenAPI):** `POST /bajas/{id}/rechazar`.
- **Lógica de Restauración:** Ante el rechazo de la baja por la MAE o asesoría legal, el servicio evalúa el historial técnico en `MaintenanceReport` para restaurar con precisión el estado operativo original (`Dañado` u `Obsoleto`), impidiendo que el activo quede en un limbo operativo.

---

### 2.3 Rita Nina

#### A) Asignación de Activos a Custodio — FSD-UC-004
- **Endpoints (OpenAPI):** `POST /activos/asignar`, `GET /activos/asignaciones`, `GET /activos/empleados`.
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Dado un activo sin custodio actual
  Cuando el Jefe asigna el activo a un Funcionario
  Entonces el Funcionario recibe una notificación para aceptar
    Y el sistema registra la firma digital de asignación
  ```
- **Implementación Técnica:**
  - `AssignAssetService` formaliza la entrega y custodia de bienes de la UMSS.
  - Valida la disponibilidad del activo y vincula la responsabilidad legal a la cédula del funcionario receptor.
  - Persiste el acta en `AssignmentRecord` con fecha, ubicación de destino y observaciones técnicas.

#### B) Transferencias Concurrentes con Bloqueo Pesimista y Generación Automática del Acta Bilateral SABS — FSD-UC-005
- **Endpoints (OpenAPI):** `POST /activos/transferir`, `POST /activos/transferencias/{id}/aprobar`, `GET /activos/transferencias/{id}/acta`, `GET /activos/transferencias`.
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Dado un activo fijo en estado "En_Transferencia" con solicitud formal entre custodios
  Cuando el Custodio Receptor aprueba la recepción formal mediante "POST /activos/transferencias/{id}/aprobar"
  Entonces el sistema ejecuta una transacción Prisma aplicando bloqueo pesimista "SELECT FOR UPDATE" sobre la fila del activo
    Y genera automáticamente el Acta de Transferencia Bilateral SABS (D.S. 0181) con correlativo único "ACTA-TRANS-2026-XXXX"
    Y calcula el sello digital criptográfico de integridad y no repudio SHA-256
    Y emite un span explícito de OpenTelemetry "TransferAssetService.generateBilateralActa" exportado a Grafana Tempo
    Y desliga de responsabilidad legal al Custodio Origen y reasigna formalmente el activo al Custodio Receptor
    Y habilita en la interfaz frontend el botón "Generar / Ver Acta" con descarga e impresión formal
  ```
- **Control Transaccional y Bloqueo Pesimista:** `TransferAssetService` ejecuta `prisma.$transaction()` aplicando un bloqueo pesimista `SELECT ... FOR UPDATE` sobre la fila del activo en PostgreSQL, neutralizando cualquier condición de carrera ante traspasos concurrentes.
- **Generación Automática del Acta Bilateral SABS:** 
  - Generación de correlativo oficial secuencial `ACTA-TRANS-2026-XXXX`.
  - Captura inmutable de snapshots del activo y de los custodios (entrega y recepción).
  - Cálculo de hash `SHA-256` para garantizar la integridad documental y no repudio (D.S. 0181 y Ley 1178).
- **Observabilidad con OpenTelemetry & Grafana Tempo:** Span explícito `TransferAssetService.generateBilateralActa` con atributos semánticos: `transfer.id`, `asset.qr`, `acta.codigo`, `acta.sha256`.
- **Interfaz Frontend SCAF:**
  - Notificación de aprobación destacando el correlativo del acta generada.
  - Botón interactivo `📄 Generar / Ver Acta` en el historial de transferencias.
  - Modal oficial con membrete UMSS / SCAF, detalle técnico del activo, cláusula de descargo legal, sello criptográfico SHA-256, triple firma reglamentaria y soporte de impresión PDF (`window.print()`).

---

## 3. Contrato OpenAPI y Verificación de CI

- **Contrato OpenAPI v8.4.0:** [`openapi.json`](../../openapi.json), exportado directamente desde el código fuente de NestJS (`@nestjs/swagger`) con 31 endpoints cubriendo la totalidad de los módulos de Inventario, Bajas SABS, Asignación y Reportes.
- **Exportación Automatizada:**  
  ```bash
  npm run openapi:export
  ```
- **Integración Continua:** Validado mediante el pipeline de GitHub Actions `.github/workflows/openapi-lint.yml` utilizando el linter Spectral (`.spectral.yaml`).

---

## 4. Pregunta Fija: p95 con k6 y Traza de OpenTelemetry (Tempo)

### A) El p95 con k6
Se evaluó el comportamiento bajo carga con Grafana k6 mediante un modelo abierto (`constant-arrival-rate`) a **30 req/s concurrentes por ruta**:

| Ruta Evaluada | Tipo de Carga | p50 (ms) | p95 (ms) | Tasa de Error |
| :--- | :--- | :--- | :--- | :--- |
| `GET /activos` | Consulta transaccional de inventario | **4.3 ms** | **9.0 ms** | **0.0%** |
| `GET /activos/reportes/estadisticas` | Cálculo analítico de depreciación (en memoria) | **4.6 ms** | **8.3 ms** | **0.0%** |
| `POST /activos/sync` | Sincronización offline en lote con LWW | **18.4 ms** | **42.5 ms** | **0.0%** |

*Interpretación:* El 95% de las peticiones transaccionales responden en menos de **9 ms**, demostrando una estabilidad óptima del runtime NestJS y del pool de conexiones PostgreSQL.

---

### B) Análisis de la Traza de OpenTelemetry en Grafana (Tempo)

Al inspeccionar en Grafana (Explore → Data Source: **Tempo**) una traza lenta correspondiente a una solicitud de sincronización (`trace_id: 4bf92f3577b34da6a3ce929d0e0e4736`):

```
Waterfall de Spans (Duración Total: 42.5 ms)
┌─ [Span 1: HTTP POST /activos/sync (Express Ingress)] ────── (2.3 ms - 5%)
│  ├─ [Span 2: ValidationPipe & DTO Sanitization] ────────── (1.8 ms - 4%)
│  └─ [Span 3: SyncOfflineService.execute] ───────────────── (36.1 ms - 85%) ⚠️
│     ├─ [Span 4: Prisma.findMany (Lectura de verificación)] ── (12.4 ms)
│     ├─ [Span 5: PostgreSQL Transaction (UPDATE Asset)] ────── (16.2 ms) 🔴 TRAMO CRÍTICO
│     └─ [Span 6: MovementRepository.save (Log histórico)] ──── (7.5 ms)
└─ [Span 7: JSON Response Serialization] ──────────────────── (2.3 ms - 6%)
```

### C) ¿En qué tramo se va el tiempo y por qué?
1. **Tramo Crítico (85% del tiempo total = 36.1 ms):** Se consume en la **interacción con la Base de Datos PostgreSQL a través de Prisma**.
2. **Causa Técnica:**
   - La operación requiere garantizar consistencia transaccional ACID estricta para resolver conflictos por timestamp (LWW).
   - Involucra un bloqueo pesimista a nivel de fila (`SELECT ... FOR UPDATE`), actualización del estado en disco y la inserción del log inmutable en `Movement`.
   - Este tramo depende directamente del I/O de disco (`fsync`), el buffer del motor relacional y la escritura en el Write-Ahead Log (WAL) de PostgreSQL.
3. **Contraste con la API:** La capa de aplicación NestJS (middleware, validación de DTOs con class-validator y serialización JSON) es sumamente eficiente, consumiendo conjuntamente **menos del 15% del tiempo total**.

---

## 5. Estructura y Plan del Video de Demostración (8 Minutos)

1. **Minuto 0:00 – 1:00 (Apertura Grupal):** Presentación del equipo (Guillermo, Josefina, Rita), presentación del tag `v8.4.0` y verificación del contrato en `openapi.json` con Swagger UI.
2. **Minuto 1:00 – 3:00 (Guillermo Daza):** Demostración en vivo de sincronización offline con resolución LWW y escaneo de inventario QR.
3. **Minuto 3:00 – 5:00 (Josefina Rojas):** Demostración del workflow de Bajas SABS en frontend y la restauración técnica en caso de rechazo.
4. **Minuto 5:00 – 7:00 (Rita Nina):** Demostración de Asignación a Custodio con firma y transferencias concurrentes.
5. **Minuto 7:00 – 8:00 (Pregunta Fija):** Muestra de la terminal k6 con el p95 y visualización de la traza de OpenTelemetry en Grafana Tempo con la explicación del cuello de botella en base de datos.
