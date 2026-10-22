# Prompt: PR-UC-002 - Motor de Sincronización Offline Batch

## 0. Metadatos del Prompt
| Campo | Valor |
| :---- | :---- |
| ID del prompt | `PR-UC-002` |
| Título | Motor de Sincronización Offline Batch |
| Caso de Uso Origen| FSD-UC-002 (Sincronización Offline) |
| Tipo de prompt | Generación de Lógica de Dominio (Service) |
| Modelo recomendado| Claude 3.5 Sonnet |
| Temperatura | `0.1` (Minimizar variabilidad, lógica estricta) |
| Versión | `v1.0.0` |
| Autor | Equipo de Arquitectura Activa360 |

---

## 1. Instrucciones para la Inteligencia Artificial (System & User Prompt)

### 1.1 Role
Eres un Desarrollador Backend Senior experto en NestJS, lógica transaccional con Postgres/TypeORM, y patrones de resiliencia y concurrencia distribuida.

### 1.2 Task
Implementar el servicio de dominio central (`sync.service.ts`) que procesa la sincronización offline masiva. El servicio recibe un lote (batch) de modificaciones del dispositivo móvil, concilia el estado actual e inyecta los resultados a la base de datos central en una transacción aislada.

### 1.3 Context
*   **Caso de Uso**: Dispositivos móviles han estado recolectando escaneos offline sin red. Al reconectarse, envían un JSON Array conteniendo todos los cambios locales.
*   **Regla de Negocio y Reconciliación**:
    *   `BR-002`: **Resolución de Conflictos basada en Timestamps**. Si el dispositivo local envía una actualización de un activo, pero la base de datos de producción central tiene un registro con un `lastUpdatedAt` posterior al `localTimestamp` del móvil, se considera un conflicto concurrente. La base de datos central **gana** (se descarta la actualización local para evitar pisar cambios más nuevos de otros inventariadores).
*   **Invariante de Transaccionalidad**:
    *   Todo el lote de sincronización se procesa de forma **atómica**. Si falla la reconciliación o la escritura de un elemento por inconsistencias graves, la transacción en la base de datos central debe hacer `ROLLBACK` completo.

### 1.4 Reasoning
Sigue estrictamente estos pasos lógicos para la generación del código:
1.  **Apertura de Transacción**: Utiliza el `DataSource` de TypeORM para inicializar un `QueryRunner` y abrir una transacción de base de datos aislada (`beginTransaction`).
2.  **Iteración y Búsqueda**: Itera sobre la lista de activos del lote. Para cada uno, busca el activo correspondiente en Postgres bloqueándolo para lectura (`SELECT FOR UPDATE` para evitar race conditions).
3.  **Comparación de Timestamps**: Aplica la lógica de "Última Escritura Gana" comparando `localTimestamp` vs `dbAsset.lastUpdatedAt`.
4.  **Actualización o Descarte**:
    *   Si el móvil es más nuevo: Actualiza el estado físico y la ubicación del activo en Postgres.
    *   Si la base de datos es más nueva: Registra el activo en una lista de "Conflictos Detectados" pero no modifiques Postgres.
5.  **Cierre de Transacción**: Si no hubo errores catastróficos, haz `commitTransaction` y retorna el reporte detallando cuántos activos fueron actualizados y cuántos se mantuvieron en conflicto.

### 1.5 Stop Condition
Detente inmediatamente cuando hayas generado:
1.  El código completo y limpio del archivo `sync.service.ts` utilizando TypeScript limpio.
2.  Las pruebas de integración unitarias usando Jest mockeando las llamadas transaccionales de TypeORM, validando la atomicidad y los casos de descarte de conflicto.

### 1.6 Output Format
Formato: Código TypeScript modular listo para ser copiado.

---

## 2. Invariantes del Código Generado
*   **Sí** debes usar transacciones explícitas de base de datos (`QueryRunner`).
*   **Sí** debes inyectar puertos de salida (`ports/out/AssetRepositoryPort`).
*   **No** debes dejar conexiones a la base de datos abiertas; el bloque `finally` del try-catch debe hacer `release()` del queryRunner.
*   **Sí** debes citar el ID de trazabilidad `<FSD-UC-002>` en la cabecera del archivo en forma de comentario.

---

## 3. Failure Modes Declarados
*   `E_UNPROTECTED_TRANSACTION`: Si el código realiza escrituras directas sobre el repositorio sin un bloque de transacción con reversión (`ROLLBACK`) en caso de error, el código no cumple las políticas y es rechazado.
*   `E_RACE_CONDITION`: Si el motor de sincronización no implementa algún bloqueo o aislamiento de lectura para activos concurrentes, se generará una alerta de carrera crítica.
