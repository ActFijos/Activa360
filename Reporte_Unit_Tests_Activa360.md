# Reporte de Pruebas Unitarias (Unit Tests) - Sistema Activa360

---

## 1. Información General del Equipo

* **Nombre del Equipo:** Grupo Activos Fijos UMSS / Equipo Activa360
* **Integrantes del Equipo:**
  * Josefina Rojas
  * Rita Nina
  * Guillermo Daza Alcalá
* **Programa:** Maestría en Desarrollo de Productos de Software con IA (UMSS)
* **Docente:** M.Sc. Luis Marcelo Garay Choqueribe
* **Fecha de Emisión:** 3 de Septiembre, 2026
* **Sistema:** Activa360 - Sistema de Gestión de Activos Fijos
* **Framework de Testing:** Jest (NestJS Hexagonal Architecture)

---

## 2. Resumen de Pruebas Unitarias

* **Cantidad Total de Unit Tests Ejecutables:** `14`
* **Test Suites Operativas:** `5` (Módulos: `Inventory`, `Compliance`, `AppCore`)
* **Porcentaje de Aprobación Activa:** `100%` de los tests ejecutados exitosamente.

---

## 3. Desglose Detallado por Función y Nombre de cada Unit Test

### 🔹 3.1. Módulo de Inventario (`src/modules/inventory`)

Este módulo se encarga del escaneo de códigos QR, actualización de estado de activos en campo y la sincronización en lote (*offline-first*).

| Componente | Función / Método Probado | Nombre del Unit Test | Descripción / Objetivo del Test | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **`ScanQrService`** <br>*(FSD-UC-001)* | `execute()` | `debería mostrar los datos del activo y permitir actualizar ubicación y estado cuando se escanea un QR válido` | Valida que al escanear un QR existente se retorne el activo y se registren los cambios de ubicación/estado. | `PASS` |
| **`ScanQrService`** <br>*(FSD-UC-001)* | `execute()` | `debería lanzar NotFoundException si el activo con código QR no existe` | Garantiza que si el código QR no está registrado en la base de datos se retorne un error HTTP 404. | `PASS` |
| **`ScanQrService`** <br>*(FSD-UC-001)* | `execute()` | `debería lanzar ConflictException si se detecta un escaneo duplicado dentro del mismo minuto` | Previene lecturas/escaneos repetidos por error del operador en un margen de 1 minuto (HTTP 409). | `PASS` |
| **`SyncOfflineService`** <br>*(FSD-UC-002)* | `execute()` | `debería procesar con éxito los activos cuando el timestamp offline es más reciente` | Verifica la resolución de conflictos dando prioridad a los datos locales cuando tienen marca de tiempo posterior. | `PASS` |
| **`SyncOfflineService`** <br>*(FSD-UC-002)* | `execute()` | `debería ignorar la actualización si el timestamp offline es anterior o igual al del servidor (conflicto)` | Garantiza que no se sobreescriban datos del servidor con información offline desactualizada. | `PASS` |
| **`SyncOfflineService`** <br>*(FSD-UC-002)* | `execute()` | `debería lanzar NotFoundException y abortar todo el lote si algún activo no existe` | Valida la atomicidad de la sincronización en lote; si un activo no existe, falla toda la operación. | `PASS` |
| **`ScanQrController`** | `scan()` | `should call execute on ScanQrUseCase and return the asset` | Verifica la integración del adaptador de entrada Web escaneando un QR individual. | `PASS` |
| **`ScanQrController`** | `sync()` | `should call execute on SyncOfflineUseCase and return sync results` | Verifica la invocación correcta del caso de uso de sincronización masiva a través del controlador REST. | `PASS` |

---

### 🔹 3.2. Módulo de Compliance y Bajas SABS (`src/modules/compliance`)

Este módulo implementa el flujo de negocio para la solicitud de baja de activos fijos según las causales normativas (Dañado, Obsoleto, etc.).

| Componente | Función / Método Probado | Nombre del Unit Test | Descripción / Objetivo del Test | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **`InitiateBajaService`** <br>*(FSD-UC-003)* | `execute()` | `debería iniciar la baja con éxito para un activo Dañado` | Prueba el flujo correcto de inicio de proceso de baja cuando el activo está reportado como dañado. | `PASS` |
| **`InitiateBajaService`** <br>*(FSD-UC-003)* | `execute()` | `debería iniciar la baja con éxito para un activo Obsoleto` | Verifica la creación del proceso de baja para la causal de obsolescencia. | `PASS` |
| **`InitiateBajaService`** <br>*(FSD-UC-003)* | `execute()` | `debería lanzar NotFoundException si el activo no existe` | Asegura respuesta HTTP 404 al intentar dar de baja un ID de activo inexistente. | `PASS` |
| **`InitiateBajaService`** <br>*(FSD-UC-003)* | `execute()` | `debería lanzar ConflictException si el activo está en un estado no permitido (ej: Nuevo)` | Aplica la regla de negocio que prohíbe iniciar baja de activos en estado 'Nuevo' (HTTP 409). | `PASS` |
| **`InitiateBajaService`** <br>*(FSD-UC-003)* | `execute()` | `debería lanzar ConflictException si el activo ya tiene un proceso de baja iniciado` | Evita la duplicidad de trámites de baja para un mismo activo activo (HTTP 409). | `PASS` |

---

### 🔹 3.3. Módulo Base / Core (`src`)

Pruebas de verificación de disponibilidad y salud básica de la aplicación NestJS.

| Componente | Función / Método Probado | Nombre del Unit Test | Descripción / Objetivo del Test | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **`AppController`** | `getHello()` | `should return "Hello World!"` | Comprueba que la raíz de la aplicación responde correctamente. | `PASS` |

---

## 4. Instrucciones para Ejecutar las Pruebas

Para reproducir la lista de unit tests en consola:

```bash
# Iniciar las pruebas unitarias
npm test

# Ejecutar las pruebas unitarias mostrando el nombre detallado de cada test
npx jest --verbose
```
