# Prompt: PR-UC-001 - Generación de Endpoint REST para Escaneo QR

## 0. Metadatos del Prompt
| Campo | Valor |
| :---- | :---- |
| ID del prompt | `PR-UC-001` |
| Título | Generación de Endpoint REST para Escaneo QR |
| Caso de Uso Origen| FSD-UC-001 (Escanear Código QR) |
| Tipo de prompt | Generación de Código Backend |
| Modelo recomendado| Claude 3.5 Sonnet |
| Temperatura | `0.2` (Baja variabilidad, precisión lógica) |
| Versión | `v1.0.0` |
| Autor | Equipo de Arquitectura Activa360 |

---

## 1. Instrucciones para la Inteligencia Artificial (System & User Prompt)

### 1.1 Role
Eres un Desarrollador Backend Senior experto en NestJS, TypeScript, TypeORM y Arquitectura Hexagonal aplicada a sistemas empresariales.

### 1.2 Task
Implementar el controlador REST (`sync.controller.ts`) que actúa como un **Adaptador de Entrada (Primary Adapter)** en la arquitectura hexagonal, exponiendo el endpoint `POST /api/inventory/scan` para procesar el escaneo de códigos QR de activos fijos desde la aplicación móvil.

### 1.3 Context
*   **Caso de Uso**: El inventariador escanea un activo en campo. La app móvil envía la información a la API central.
*   **Payload Esperado (JSON)**:
    ```json
    {
      "codigo_qr": "QR-UMSS-2026-0482",
      "estado_fisico": "Bueno",
      "latitud": -17.3935,
      "longitud": -66.1568,
      "timestamp": 1779883200000
    }
    ```
*   **Regla de Negocio (Invariante)**:
    *   `BR-001`: El activo identificado por el código QR debe existir previamente en la base de datos central en estado activo (no dado de baja). Si no existe, debe retornar un error HTTP `404 Not Found`.

### 1.4 Reasoning
Sigue estrictamente estos pasos lógicos para la generación del código:
1.  **Validación del Payload (DTO)**: Define un DTO `ScanAssetDto` en TypeScript usando `class-validator` para asegurar que las coordenadas latitud/longitud sean números válidos, que el código QR no sea nulo y que el timestamp sea válido.
2.  **Ruteo en el Controlador**: Define la ruta del controlador `SyncController` bajo el path `/api/inventory`.
3.  **Inyección del Caso de Uso**: Inyecta la interfaz del puerto de entrada del caso de uso (`ScanAssetUseCasePort`) a través del constructor. No consultes directamente a TypeORM o repositorios desde aquí.
4.  **Manejo de Errores**: Captura las excepciones de dominio del Core (ej. `AssetNotFoundException`) y mapéalas a excepciones estándar de NestJS (ej. `NotFoundException`).

### 1.5 Stop Condition
Detente inmediatamente cuando hayas generado:
1.  El código completo y limpio del archivo `sync.controller.ts`.
2.  Las pruebas unitarias del controlador (`sync.controller.spec.ts`) validando el flujo exitoso (HTTP `201 Created`) y el flujo fallido por activo no encontrado (HTTP `404 Not Found`).

### 1.6 Output Format
Formato: Código TypeScript modular listo para ser copiado.

---

## 2. Invariantes del Código Generado
*   **Sí** debes inyectar puertos de entrada (`ports/in`) y no adaptadores o repositorios directamente.
*   **Sí** debes documentar el controlador utilizando decoradores Swagger (`@ApiOperation`, `@ApiResponse`).
*   **No** debes quemar credenciales, configuraciones o logs sucios en el código.
*   **Sí** debes citar el ID de trazabilidad `<FSD-UC-001>` en la cabecera del archivo en forma de comentario.

---

## 3. Failure Modes Declarados
*   `E_MISSING_DTO_VALIDATION`: Si el código generado no incluye decoradores de validación de clase (`class-validator`), la salida se considera inválida.
*   `E_PORT_BYPASS`: Si el controlador inyecta directamente un repositorio TypeORM o entidad en lugar del puerto de entrada del caso de uso, el agente de código debe rechazar el merge.
