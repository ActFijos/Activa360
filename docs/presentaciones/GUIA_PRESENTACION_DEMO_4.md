# GUÍA DEFINITIVA DE PRESENTACIÓN Y GRABACIÓN · DEMO 4
## Activa360 – Release 8.4.0 (Módulo 8 - Maestría UMSS)

---

### Metadatos de la Presentación
* **Materia:** Módulo 8 - Arquitectura de Software y DevOps Avanzado (UMSS)
* **Puntaje en juego:** 19 puntos (Última evaluación del módulo)
* **Fecha límite de entrega:** Lunes 16 de noviembre de 2026 a las 23:59
* **Tiempo límite del video:** 8 minutos (estricto)
* **Plataforma de subida:** YouTube (como video no listado) o enlace a Google Drive con acceso público para el docente.
* **Integrantes del Grupo:**
  1. **Guillermo Omar Daza Alcalá**
  2. **Josefina Rojas** (`josefina.rojas.mpsia@est.umss.edu`)
  3. **Rita Nina** (`rita.nina.mpsia@est.umss.edu`)

---

## 📋 Resumen Rápido de Enlaces del Release

Ten estos enlaces abiertos en pestañas de tu navegador antes de empezar a grabar:
1. **Rama del Release:** `https://github.com/ActFijos/Activa360/tree/release/8.4.0`
2. **Tag Oficial:** `https://github.com/ActFijos/Activa360/releases/tag/v8.4.0`
3. **Commit:** `https://github.com/ActFijos/Activa360/commit/430b32b`
4. **Documento Técnico Demo 4:** `https://github.com/ActFijos/Activa360/blob/release/8.4.0/docs/demos/demo-4.md`
5. **Notas de Aportes:** `https://github.com/ActFijos/Activa360/blob/release/8.4.0/8.4.0-aportes.md`
6. **Swagger UI Local:** `http://localhost:3000/api/docs` (o archivo `openapi.json`)
7. **Frontend Local:** `http://localhost:5173`

---

## 🎬 Guion Minuto a Minuto para el Video (8 Minutos)

```
0:00 ─── 1:00  [Bloque 1] Apertura y Contrato OpenAPI v8.4.0 (Todo el equipo)
1:00 ─── 3:00  [Bloque 2] Guillermo Daza: Sincronización Offline e Inventario QR
3:00 ─── 5:00  [Bloque 3] Josefina Rojas: Workflow Bajas SABS y Restauración
5:00 ─── 7:00  [Bloque 4] Rita Nina: Asignación a Custodio y Transferencias
7:00 ─── 8:00  [Bloque 5] Pregunta Fija: p95 con k6 y Traza en Grafana Tempo
```

---

### ⏱️ Bloque 1: Apertura y Contrato OpenAPI (Minuto 0:00 a 1:00)
**Responsable:** Guillermo Daza (o apertura conjunta de los 3).

* **Qué mostrar en pantalla:**
  1. La pestaña de GitHub con la rama `release/8.4.0` y el archivo `8.4.0-aportes.md`.
  2. La pestaña de Swagger UI (`/api/docs`) o el archivo `openapi.json`.
* **Qué decir (Guion):**
  > *"Buenas tardes profesor. Somos el equipo de Activa360, conformado por Guillermo Daza, Josefina Rojas y Rita Nina. Hoy presentamos nuestra Demo 4 correspondiente a la versión release/8.4.0.  
  > En este release consolidamos las funcionalidades clave de la especificación funcional (FSD) para la gestión integral de activos fijos de la UMSS.  
  > Como primer punto, mostramos nuestro contrato OpenAPI 8.4.0, generado automáticamente desde el código NestJS mediante `@nestjs/swagger` y validado en nuestro pipeline de CI con Spectral. Contamos con 31 endpoints completamente documentados y tipados."*

---

### ⏱️ Bloque 2: Funcionalidades de Guillermo Daza (Minuto 1:00 a 3:00)
**Responsable:** Guillermo Omar Daza Alcalá.

#### 1. FSD-UC-002: Sincronización de Datos Offline (`POST /activos/sync`)
* **Qué mostrar en pantalla:**
  1. Frontend en la sección de Activos o Swagger UI en `POST /activos/sync`.
  2. Enviar un payload JSON con un lote de 2 o 3 activos escaneados fuera de línea.
* **Criterio de Aceptación (Gherkin):**
  ```gherkin
  Dado que el dispositivo recuperó la conectividad
  Cuando el sistema detecta registros pendientes de sincronización
  Entonces envía los datos al servidor en lote
    Y resuelve conflictos priorizando el timestamp más reciente (LWW)
  ```
* **Qué decir (Guion):**
  > *"Mi primera funcionalidad es la Sincronización Offline, caso de uso FSD-UC-002. En campo, los inventariadores trabajan en sótanos o zonas sin red. Cuando el dispositivo recupera señal, despacha un lote mediante `POST /activos/sync`.  
  > El sistema implementa un algoritmo de resolución de conflictos por timestamp (Last Write Wins). Si el timestamp del móvil es más reciente que el de la base central, actualiza las coordenadas GPS y el estado físico del activo de manera atómica, y persiste un log inmutable de auditoría en la tabla `Movement`. Si alguno no existe, se rechaza el lote completo para garantizar consistencia."*

#### 2. FSD-UC-001: Registro e Inventario QR en Campo (`POST /inventory/scan`)
* **Qué mostrar en pantalla:**
  1. Vista de escaneo QR en la app web (`/activos` o `/inventario`).
* **Qué decir (Guion):**
  > *"Mi segunda funcionalidad es el Inventario QR con control de concurrencia, caso FSD-UC-001. A nivel de base de datos implementamos la restricción única `@@unique([campaignId, assetId])`. Esto garantiza que en auditorías masivas dos inventariadores no puedan duplicar el escaneo del mismo bien dentro de la misma campaña."*

---

### ⏱️ Bloque 3: Funcionalidades de Josefina Rojas (Minuto 3:00 a 5:00)
**Responsable:** Josefina Rojas.

#### 1. FSD-UC-003: Workflow de Bajas SABS (D.S. 0181) (`POST /bajas`, `POST /bajas/{id}/aprobar`)
* **Qué mostrar en pantalla:**
  1. Pantalla de Bajas (`frontend/src/pages/Bajas.tsx`).
  2. Crear una solicitud de baja seleccionando un activo dañado u obsoleto, llenando la justificación legal y adjuntando la URL de la evidencia fotográfica.
  3. Demostrar la aprobación de la baja.
* **Criterio de Aceptación (Gherkin):**
  ```gherkin
  Dado un activo en estado "Dañado" u "Obsoleto"
  Cuando el Jefe de Activos inicia el proceso de baja
  Entonces el sistema requiere una justificación y evidencia
    Y cambia el estado del activo a "En Proceso de Baja"
  ```
* **Qué decir (Guion):**
  > *"Mi primera funcionalidad es el Workflow de Bajas bajo la normativa boliviana D.S. 0181 SABS, caso FSD-UC-003.  
  > El sistema valida que el usuario tenga el rol de Jefe de Activos Fijos. Al iniciar la baja, el sistema exige obligatoriamente la justificación normativa y la evidencia técnica. El activo pasa inmediatamente a estado 'En Proceso de Baja' y la solicitud queda 'En Revisión'.  
  > Al aprobarse la baja con `POST /bajas/{id}/aprobar`, el activo pasa al estado irreversible 'Dado_De_Baja' y se retira del inventario operativo."*

#### 2. FSD-UC-003 (Criterio 2): Rechazo Normativo y Restauración Técnica Condicional
* **Qué mostrar en pantalla:**
  1. En la tabla de Bajas, presionar el botón "Rechazar" en una solicitud pendiente (`POST /bajas/{id}/rechazar`).
  2. Mostrar cómo el activo vuelve a su estado técnico anterior.
* **Qué decir (Guion):**
  > *"Mi segunda funcionalidad es la Restauración Técnica ante rechazo. Si la Dirección o la MAE rechazan la baja, el sistema no deja el activo en un estado ambiguo; consulta el peritaje registrado en `MaintenanceReport` y restaura automáticamente el activo a su condición operativa exacta (`Dañado` u `Obsoleto`), permitiendo que vuelva a programarse para reparación."*

---

### ⏱️ Bloque 4: Funcionalidades de Rita Nina (Minuto 5:00 a 7:00)
**Responsable:** Rita Nina.

#### 1. FSD-UC-004: Asignación a Custodio y Actas Patrimoniales (`POST /activos/asignar`)
* **Qué mostrar en pantalla:**
  1. Pantalla de Asignación (`frontend/src/pages/Asignacion.tsx`).
  2. Seleccionar un activo sin custodio, elegir a un funcionario de la nómina (`GET /activos/empleados`) y presionar "Asignar Activo".
  3. Mostrar la tabla de histórico de asignaciones (`GET /activos/asignaciones`).
* **Criterio de Aceptación (Gherkin):**
  ```gherkin
  Dado un activo sin custodio actual
  Cuando el Jefe asigna el activo a un Funcionario
  Entonces el Funcionario recibe una notificación para aceptar
    Y el sistema registra la firma digital de asignación
  ```
* **Qué decir (Guion):**
  > *"Mi primera funcionalidad es la Asignación a Custodio, caso de uso FSD-UC-004. En instituciones públicas, cada bien debe tener un responsable legal.  
  > En la pantalla de asignación, el sistema valida que el activo esté libre, vincula la cédula y nombre del funcionario receptor y genera el registro en `AssignmentRecord` con fecha, destino físico y observaciones, respaldando el acta formal de entrega."*

#### 2. FSD-UC-005: Transferencias Concurrentes con Bloqueo Pesimista (`POST /activos/transferir`)
* **Qué mostrar en pantalla:**
  1. Pantalla de Transferencias (`frontend/src/pages/Transferencias.tsx`) o endpoint en Swagger.
* **Qué decir (Guion):**
  > *"Mi segunda funcionalidad es el Traspaso de Activos con control de concurrencia, caso FSD-UC-005. Cuando un custodio transfiere un bien a otro, para evitar que dos solicitudes simultáneas dejen el activo asignado a dos personas distintas, implementamos `prisma.$transaction()` con bloqueo pesimista `SELECT FOR UPDATE`. Hasta que el receptor no aprueba la transferencia, la responsabilidad no se libera."*

---

### ⏱️ Bloque 5: Pregunta Fija de k6 y OpenTelemetry (Minuto 7:00 a 8:00)
**Responsable:** Guillermo Daza (con soporte de Josefina y Rita).

#### 1. Mostrar el p95 de k6 (Terminal o Pantalla)
* **Qué mostrar:** La terminal con la tabla de resultados de k6 o la tabla de `docs/demos/demo-4.md`.
* **Qué decir (Guion):**
  > *"Pasamos a la pregunta fija de la evaluación: mostrar el p95 con k6 y explicar la traza en OpenTelemetry.  
  > Ejecutamos pruebas de carga en modelo abierto a 30 peticiones por segundo continuas. Como pueden ver en la tabla de k6:  
  > En la ruta transaccional `GET /activos`, el p50 es de **4.3 ms** y el percentil 95 (**p95**) es de apenas **9.0 ms** con **0.0% de errores**. En la sincronización por lotes `POST /activos/sync`, el p95 se sitúa en **42.5 ms**."*

#### 2. Mostrar la Traza en Grafana (Explore → Tempo)
* **Qué mostrar:** Gráfico de cascada de spans de la traza de 42.5 ms (o el diagrama de cascada de `demo-4.md`).
* **Qué decir (Guion - RESPUESTA EXACTA):**
  > *"Al abrir la traza lenta en Grafana Tempo, analizamos en qué tramo se va el tiempo y por qué:  
  > 1. El **85% del tiempo total (36.1 milisegundos)** se va exclusivamente en el **tramo de persistencia en PostgreSQL a través de Prisma**.  
  > 2. **¿Por qué se va el tiempo ahí?** Porque para resolver conflictos por timestamp (LWW) y transferir activos sin condiciones de carrera, la base de datos debe ejecutar una transacción ACID con bloqueo de fila (`SELECT FOR UPDATE`), actualización en `Asset` e inserción en el log de `Movement`. Esto exige operaciones de I/O en disco (`fsync`) y escritura en el Write-Ahead Log (WAL) de PostgreSQL.  
  > 3. En contraste, el tramo de la aplicación NestJS (middleware, parsing y validación de DTOs) consume menos del **15% del tiempo** (apenas 4 ms).  
  > Por tanto, el cuello de botella físico reside en las garantías de persistencia transaccional y no en la capa de software."*

#### 3. Cierre (Últimos 15 segundos)
  > *"Con esto demostramos que Activa360 cumple con los casos de uso del FSD, contratos OpenAPI automatizados y un rendimiento observable con p95 por debajo de los 10 ms. Muchas gracias."*

---

## 💡 Banco de Respuestas Rápidas para Preguntas del Docente (FAQ)

### P1: "¿Por qué el p95 es mejor métrica que el promedio (avg)?"
* **Respuesta:** *"Porque el promedio oculta los picos de degradación extrema. El p95 garantiza que el 95% de los usuarios reales experimentan tiempos menores o iguales a ese valor, midiendo la consistencia del sistema frente a la cola larga (tail latency)."*

### P2: "¿Por qué la base de datos toma el 85% del tiempo en la traza?"
* **Respuesta:** *"Porque la sincronización offline y las transferencias son operaciones de escritura con consistencia estricta ACID. Cada escritura requiere sincronización obligatoria en disco (`fsync`) y registro en el WAL de PostgreSQL para asegurar que los datos no se pierdan si se corta la energía."*

### P3: "¿Cómo generaron el openapi.json?"
* **Respuesta:** *"Lo generamos directamente desde el código NestJS ejecutando `npm run openapi:export`. Utiliza `@nestjs/swagger` inspeccionando los decoradores de los controladores y DTOs, eliminando cualquier desfase entre el código y el contrato."*

---

## 🛠️ Comandos de Verificación antes de Grabar

Abre dos terminales para tener todo levantado:

```bash
# Terminal 1: Backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

* Backend corriendo en: `http://localhost:3000` (Swagger en `/api/docs`)
* Frontend corriendo en: `http://localhost:5173`
