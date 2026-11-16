# Demo 3 · release/8.3.0

Release: https://github.com/ActFijos/Activa360/releases/tag/v8.3.0  
Notas del release: [`8.3.0-aportes.md`](../../8.3.0-aportes.md)

## 1. Integrantes y funcionalidades

| Integrante | Funcionalidad | Caso de uso FSD | Repositorio |
| :---- | :---- | :---- | :---- |
| Guillermo Omar Daza Alcalá | Sincronización de datos offline con resolución de conflictos por timestamp (`POST /activos/sync`) | FSD-UC-002 – Sincronización de datos offline | https://github.com/ActFijos/Activa360 |
| Josefina Rojas | Workflow de Baja (SABS) con justificación, evidencia y control de estados (`POST /bajas`, `GET /bajas`, `POST /bajas/{id}/aprobar`, `POST /bajas/{id}/rechazar`) | FSD-UC-003 – Workflow de Baja (SABS) | https://github.com/ActFijos/Activa360 |
| Rita Nina | Asignación de Activos a Custodio con registro y trazabilidad (`POST /activos/asignar`, `GET /activos/asignaciones`, `GET /activos/empleados`) | FSD-UC-004 – Asignación a Custodio | https://github.com/ActFijos/Activa360 |

---

## 2. Detalle de funcionalidades presentadas

### 2.1 Sincronización de datos offline — FSD-UC-002 (Guillermo Omar Daza Alcalá)

- **Endpoints (OpenAPI):** `POST /activos/sync`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado que el dispositivo recuperó la conectividad
  Cuando el sistema detecta registros pendientes de sincronización
  Entonces envía los datos al servidor en lote
    Y resuelve conflictos priorizando el timestamp más reciente
  ```
- **Integridad y resolución de conflictos:**
  - El servicio `SyncOfflineService` procesa un lote de registros escaneados fuera de línea.
  - **Transaccionalidad previa:** Verifica primero la existencia de todos los códigos QR del lote; si alguno no existe, lanza `NotFoundException` y aborta la operación completa para prevenir inconsistencias parciales.
  - **Algoritmo de resolución (LWW - Last Write Wins):** Compara `itemDate.getTime() > assetDate.getTime()`. Solo si la actualización proveniente del dispositivo móvil es más reciente que la del servidor, se aplican los cambios de ubicación (`latitude`, `longitude`) y de estado en la entidad `Asset`.
  - **Auditoría de movimientos:** Cada sincronización aprobada persiste un registro inmutable en el repositorio `MovementRepositoryPort` mediante la entidad `Movement` con identificador UUID, trazabilidad temporal y coordenadas geoespaciales.

---

### 2.2 Workflow de Baja (SABS) — FSD-UC-003 (Josefina Rojas)

- **Endpoints (OpenAPI):** `POST /bajas`, `GET /bajas`, `POST /bajas/{id}/aprobar`, `POST /bajas/{id}/rechazar`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado un activo en estado "Dañado" u "Obsoleto"
  Cuando el Jefe de Activos inicia el proceso de baja
  Entonces el sistema requiere una justificación y evidencia
    Y cambia el estado del activo a "En Proceso de Baja"
  ```
- **Control normativo de estados y auditoría:**
  - `InitiateBajaService` valida que el activo exista y que el solicitante (`jefeId`) cuente con el rol institucional de Jefe de Activos Fijos.
  - **Justificación y evidencia obligatorias:** Requiere el ingreso explícito de motivos normativos conforme al D.S. 0181 (SABS) y el registro de evidencia documental/fotográfica adjunta.
  - **Transición de estados:** Cambia el estado del activo a `En Proceso de Baja` y crea el registro de baja en estado inicial `EN_REVISION`.
  - **Resolución de la baja:**
    - Al invocar `POST /bajas/{id}/aprobar`, el registro de baja pasa a `APROBADA` y el activo se retira definitivamente del inventario operativo (`Dado_De_Baja`).
    - Al invocar `POST /bajas/{id}/rechazar`, el registro de baja pasa a `RECHAZADA` y el sistema evalúa el diagnóstico técnico previo registrado en `MaintenanceReport` para restaurar con precisión el estado operativo anterior (`Dañado` u `Obsoleto`).

---

### 2.3 Asignación de Activos a Custodio — FSD-UC-004 (Rita Nina)

- **Endpoints (OpenAPI):** `POST /activos/asignar`, `GET /activos/asignaciones`, `GET /activos/empleados`.
- **Criterios de aceptación (FSD):**
  ```gherkin
  Dado un activo sin custodio actual
  Cuando el Jefe asigna el activo a un Funcionario
  Entonces el Funcionario recibe una notificación para aceptar
    Y el sistema registra la formalización de custodia del activo
  ```
- **Trazabilidad y custodia patrimonial:**
  - `AssignAssetService` formaliza la entrega y custodia de bienes institucionales bajo arquitectura hexagonal.
  - Valida la disponibilidad del activo y vincula la responsabilidad directa al funcionario receptor (`responsible`).
  - **Registro de asignación:** Persiste en `AssignmentRecord` el detalle completo del activo asignado (`assetId`), fecha formal (`date`), destino físico (`destination`) y observaciones técnicas/administrativas.
  - **Consulta y nómina:** Permite auditar el histórico total de traspasos y asignaciones mediante `GET /activos/asignaciones`, e integrarse con la nómina de funcionarios institucionales mediante `GET /activos/empleados`.

---

## 3. Infraestructura de Producción y Stack Docker

Para garantizar reproducibilidad y portabilidad en despliegues reales, se implementaron artefactos de contenedorización bajo estándares de producción:

### 3.1 Dockerfiles Multi-stage y Optimización
1. **Backend (`Dockerfile`):**
   - **Etapa `builder` (`node:20-alpine`):** Instalación determinista con `npm ci` (incorporando `.npmrc` con `legacy-peer-deps`), generación tipada del cliente Prisma (`npx prisma generate`) y compilación TypeScript NestJS (`npm run build`).
   - **Etapa `runner` (`node:20-alpine`):** Imagen minimalista final con exclusión de devDependencies (`npm ci --omit=dev`), limpieza de caché, usuario no privilegiado (`USER 1000:1000`) y `HEALTHCHECK` nativo mediante Node.js fetch sin necesidad de binarios externos.
2. **Frontend (`frontend/Dockerfile`):**
   - **Etapa `builder` (`node:20-alpine`):** Compilación de la SPA React + Vite + TypeScript (`tsc -b && vite build`).
   - **Etapa `runner` (`nginx:1.27-alpine`):** Servidor web Nginx de alto rendimiento con configuración SPA (`try_files $uri $uri/ /index.html`), soporte dual IPv4 e IPv6 (`listen 80; listen [::]:80;`), y `HEALTHCHECK` activo contra `http://127.0.0.1/`.

### 3.2 Orquestación con `compose.yaml`
El archivo `compose.yaml` en la raíz orquesta el stack productivo con dependencias basadas en estado de salud (`condition: service_healthy`):
- **`postgres`:** PostgreSQL 15 Alpine con healthcheck `pg_isready -U admin -d activa360` y persistencia en volumen `postgres_data`. Mapeado dual a puertos 5432 y 5433 en host.
- **`backend`:** Contenedor NestJS compilado sobre red interna conectada a PostgreSQL (`postgres:5432`), expuesto en el puerto 3000 con healthcheck en `/`.
- **`frontend`:** Contenedor Nginx expuesto en el puerto 80, condicionado a que el backend esté saludable.

**Comando de inicialización:**
```bash
docker compose -f compose.yaml up -d --build --wait
```

### 3.3 Auditoría de Seguridad y Calidad Estática
- **Hadolint (Dockerfile Linter):** Ejecutado sobre ambos Dockerfiles (`ghcr.io/hadolint/hadolint:latest-alpine`), logrando **0 errores y 0 advertencias** mediante notación JSON en instrucciones `CMD` y uso de UID numérico no-root.
- **Trivy (Escáner de Seguridad de Contenedores y Configuración):**
  - `trivy image --severity HIGH,CRITICAL activa360-backend:8.3.0`: 0 vulnerabilidades en dependencias de aplicación (`app/node_modules/`).
  - `trivy config compose.yaml`: 0 hallazgos de mala configuración en orquestación.

---

## 4. Análisis de Rendimiento con k6 (`bench/load-test.js`)

Se evaluó la capacidad de atención y estabilidad del backend levantado en Docker bajo un régimen de **ritmo de llegada constante (Constant Arrival Rate)** sobre el endpoint clave de consulta de asignaciones de activos (`GET /activos/asignaciones` - FSD-UC-004).

### 4.1 Configuración de la Prueba (`bench/load-test.js`)
- **Ejecutor:** `constant-arrival-rate`
- **Tasa de solicitudes:** `20 req/s` fija
- **Duración por corrida:** `30s` (600 solicitudes por corrida)
- **Umbrales (Thresholds):** `http_req_failed < 1%`, `http_req_duration p(95) < 500ms`
- **VUs pre-asignadas:** 20 (máximo 50)

### 4.2 Resultados de las 3 Corridas Consecutivas

| Corrida | Total Solicitudes | Tasa de Error (`http_req_failed`) | Latencia Promedio (`avg`) | Latencia Mediana (`med`) | Latencia p(95) | Resultado Thresholds |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Corrida 1** | 600 req | **0.00%** (0 fallos) | 4.38 ms | 3.26 ms | **8.93 ms** | Superado (100% checks) |
| **Corrida 2** | 601 req | **0.00%** (0 fallos) | 3.87 ms | 3.03 ms | **7.41 ms** | Superado (100% checks) |
| **Corrida 3** | 601 req | **0.00%** (0 fallos) | 4.03 ms | 3.20 ms | **7.55 ms** | Superado (100% checks) |

### 4.3 Cálculo de Medianas y Diagnóstico Técnico
- **Mediana de Latencia p(95):** `[7.41 ms, 7.55 ms, 8.93 ms]` $\rightarrow$ **7.55 ms**.
- **Mediana de Tasa de Fallos:** **0.00%**.
- **Análisis de Capacidad:**
  1. **Pool de conexiones Prisma / PostgreSQL:** El pool gestionó de forma eficiente las 20 transacciones por segundo concurrentes con tiempos medios de respuesta de ~3.1 ms, sin degradación por saturación de descriptores ni encolamiento de sockets.
  2. **Estabilidad del Event Loop (Node.js):** El percentil 95 se mantuvo por debajo de 9 ms en las tres corridas consecutivas, evidenciando un procesamiento asíncrono no bloqueante en la capa de controladores y adaptadores de dominio.
  3. **Ausencia total de errores:** Con 1,802 solicitudes ejecutadas en total a través de las 3 corridas, no se registró ningún código de estado 5xx ni 4xx, validando la solidez de la imagen en contenedor.

---

## 5. Análisis Arquitectónico: Extracción a Microservicio (E3)

Como parte de la evolución arquitectónica hacia sistemas distribuidos, se realizó el análisis técnico de descomposición modular tomando como candidato el módulo de **Bajas SABS (`compliance-sabs-service`)**.

### 5.1 Justificación Técnica de la Extracción
1. **Aislamiento Normativo y Legal:** El ciclo de vida de una Baja SABS (D.S. 0181) involucra flujos jurídicos de aprobación multinivel, auditoría estatal inmutable y dictámenes técnicos independientes del escaneo diario de inventario.
2. **Carga Computacional Asimétrica:** La generación de Actas de Baja en formato PDF (renderizado en memoria de membretes oficiales, tablas de firmas, sellos y expedientes `BJ-XXXXXXXX`) consume CPU y memoria intensiva; extraerlo previene que la generación masiva de actas interfiera con el escaneo QR de alta frecuencia en campo.
3. **Ciclo de Despliegue y Cumplimiento:** Las regulaciones patrimoniales y decretos supremos cambian con menor frecuencia que las reglas operativas de almacén, permitiendo congelar versiones auditables del servicio de bajas.

### 5.2 Comparativa de Interfaz: Monolito vs. Microservicio

| Criterio Arquitectónico | En el Monolito Actual (Hexagonal) | Como Microservicio Independiente (`compliance-sabs-service`) |
| :--- | :--- | :--- |
| **Límite de Dominio (Boundary)** | En memoria (`src/modules/compliance`), interfaces de puertos TypeScript (`InitiateBajaUseCase`, `BajaRepositoryPort`). | Aislado en proceso y repositorio independiente con su propio contenedor Docker y runtime. |
| **Comunicación Inter-módulo** | Llamadas a métodos en memoria en el mismo Event Loop de NestJS; inyección de dependencias modular. | **Síncrona:** API REST / gRPC con contrato OpenAPI/Proto para validación de existencia de activo (`GET /activos/{id}`).<br>**Asíncrona:** Broker de mensajería (RabbitMQ / Kafka) para eventos de dominio. |
| **Gestión de Transacciones** | Transacciones ACID locales compartidas en PostgreSQL mediante Prisma (`$transaction`). | Consistencia eventual mediante patrón **Saga (Orquestada/Coreografiada)** con transacciones compensatorias. |
| **Eventos de Dominio** | Eventos EventEmitter en memoria locales. | Eventos distribuidos publicados en broker: `AssetMarkedForBajaEvent`, `ActaPdfGeneratedEvent`, `BajaRejectedEvent`. |
| **Almacenamiento y Base de Datos** | Esquema compartido en PostgreSQL (`activa360.app`). | Base de datos dedicada y desacoplada (`compliance_db`) con réplica de solo lectura o proyecciones CQRS. |
| **Latencia Operativa** | Ultrabaja en memoria ($\le 2$ ms). | Reducción de acoplamiento a cambio de latencia de red RPC ($\sim 15 - 35$ ms). |

---

## 6. Contrato OpenAPI y flujo de validación

- **Contrato OpenAPI:** [`openapi.json`](../../openapi.json), generado mediante `@nestjs/swagger` y validado contra el esquema de la solución. Incluye las rutas y esquemas de los casos de uso:
  - `/activos/sync`
  - `/bajas`, `/bajas/{id}/aprobar`, `/bajas/{id}/rechazar`
  - `/activos/asignar`, `/activos/asignaciones`, `/activos/empleados`
- **Exportación automatizada:** `scripts/export-openapi.ts` (`npm run openapi:export`).
- **CI & Calidad:** Reglas de validación OpenAPI configuradas en `.github/workflows/openapi-lint.yml` con linter Spectral (`.spectral.yaml`).
