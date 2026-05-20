---
name: endpoint-security-auditor
description: >
  Audita controladores (Controllers) y DTOs de NestJS en el backend de Activa360.
  Verifica el cumplimiento de políticas de autenticación (JWT Guards), autorización (Roles RBAC),
  validación de entradas (class-validator) y sanitización de salidas.
allowed-tools:
  - read
  - edit
model-tier: sonnet
fsd-version-min: v1.0
status: stable
owner: "Equipo Activa360"
---

# Skill: Auditor de Seguridad de Endpoints (NestJS / Activa360)

Este skill define el procedimiento, reglas e invariantes de seguridad que un agente de IA debe seguir para auditar controladores y clases de transferencia de datos (DTOs) en el backend de **Activa360**. El objetivo principal es identificar y corregir brechas de seguridad antes de que el código sea integrado a la rama `release/*`.

---

## 1. Cuándo activarlo (triggers)
* **DURANTE**: Fase de revisión de código (Code Review), auditorías de seguridad previas a Pull Requests o refactorización de endpoints.
* **ARRANCA cuando**: El usuario solicita auditar la seguridad de un endpoint o controlador específico indicando su ruta (ej. *"Audita la seguridad de `src/modules/inventory/adapters/in/web/sync.controller.ts`"* o *"Revisa si el endpoint de baja de activos es seguro"*).
* **NO ACTIVAR cuando**: Se estén haciendo cambios lógicos en la base de datos o editando diagramas C4 que no alteren la interfaz HTTP.

---

## 2. Entradas obligatorias (Inputs)
Para ejecutar la auditoría de forma efectiva, el agente requiere:
1. **Ruta del controlador de NestJS** a analizar (ej. `src/**/*.controller.ts`).
2. **DTOs asociados** importados en dicho controlador (ej. `src/**/*.dto.ts`).
3. **Acceso al FSD** (`docs/FSD_Activos_Fijos.md`) para verificar las Reglas de Negocio (`BR-XXX`) y permisos/roles especificados para cada caso de uso (`FSD-UC-XXX`).

Si falta alguno de estos elementos, el agente detendrá su ejecución y solicitará el contexto faltante al usuario.

---

## 3. Fuentes de verdad (Jerarquía de precedencia)
1. **Reglas de Negocio de Seguridad** en `docs/FSD_Activos_Fijos.md` (§5 y especificaciones de Casos de Uso).
2. **Políticas globales de acceso** definidas en el `DOCUMENTO_TECNICO_INICIAL_Activos_Fijos.md`.
3. **Estándares del OWASP Top 10** aplicados a APIs RESTful.

---

## 4. Procedimiento de Auditoría
El agente ejecutará los siguientes pasos secuenciales:

### Paso 1: Mapeo y Lectura del Endpoint
* Localizar el archivo del controlador y leer todas sus importaciones y decoradores principales.
* Identificar todos los métodos HTTP expuestos (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`).

### Paso 2: Análisis de Autenticación y Autorización (RBAC)
* Verificar que la clase o el método individual tengan el decorador `@UseGuards(JwtAuthGuard)` (o el guard correspondiente del sistema).
* Confirmar la existencia de controles de autorización por rol usando `@Roles(Role.NombreRol)` o equivalentes.
* **Acción ante fallas:** Si un endpoint mutativo (`POST`, `PUT`, `DELETE`, `PATCH`) carece de guard o roles y el FSD no lo define explícitamente como público, clasificarlo como **Brecha Crítica**.

### Paso 3: Análisis de Validación de Datos (DTOs)
* Inspeccionar los parámetros anotados con `@Body()`, `@Query()` y `@Param()`.
* Asegurar que no utilicen el tipo `any` ni tipos primitivos directos sin validación (como `string` o `number` en el body).
* Abrir el archivo DTO correspondiente y comprobar que cada propiedad expuesta tenga al menos un decorador de validación de `class-validator` (ej. `@IsString()`, `@IsUUID()`, `@IsNotEmpty()`, `@IsOptional()`).

### Paso 4: Análisis de Fuga de Información (Information Leakage)
* Asegurar que los métodos del controlador **no** retornen directamente entidades del dominio o de la base de datos (PostgreSQL).
* Comprobar que el tipo de retorno esté mapeado a un DTO de respuesta (ej. `AssetResponseDto`) o sanitizado mediante serializadores.
* Verificar que en los DTOs no existan campos sensibles como contraseñas, hashes, tokens de sesión o claves secretas sin la anotación `@Exclude()`.

### Paso 5: Análisis de Control de Errores
* Comprobar que no haya estructuras `try-catch` que capturen excepciones de la base de datos y las devuelvan directamente al cliente en formato crudo. Todas las excepciones de negocio deben ser transformadas a HTTP Exceptions de NestJS (ej. `BadRequestException`, `ForbiddenException`).

---

## 5. Salida esperada
Al completar la auditoría, el agente generará un informe estructurado con el siguiente formato:

### 1. Resumen Ejecutivo de Seguridad
Una tabla con el conteo de hallazgos por nivel de severidad:
* 🚨 **CRÍTICA:** Vulnerabilidades de bypass de autenticación o inyecciones de datos directas.
* ⚠️ **ALTA:** Ausencia de validaciones de DTOs o falta de sanitización de datos de salida.
* ℹ️ **MEDIA/BAJA:** Inconsistencias de estilo de código de seguridad o falta de rate-limiting en endpoints no críticos.

### 2. Detalle de Hallazgos
Para cada vulnerabilidad encontrada, se especificará:
* **Ubicación:** Archivo y línea exacta de código.
* **Riesgo:** Explicación técnica del impacto de la falla.
* **Código Vulnerable vs. Solución Sugerida:** Un diff de código claro que resuelva la falla.

---

## 6. Verificación (Criterios de "Bien Hecho")
Un controlador se considerará seguro y auditado con éxito si:
- [ ] Todos sus endpoints mutativos cuentan con `@UseGuards(JwtAuthGuard)`.
- [ ] La validación de roles coincide exactamente con la matriz de roles y permisos del FSD.
- [ ] El 100% de los DTOs de entrada tienen validaciones robustas y tipado estricto.
- [ ] No se exponen entidades de base de datos ni campos sensibles al cliente.

---

## 7. Anti-patrones específicos a evitar
* **By-pass de DTOs:** Recibir objetos directamente en el controlador usando destructuración manual sin validación.
* **Manejo de Roles Hardcodeados:** Usar strings planos para declarar roles (ej. `@Roles('admin')`) en lugar de enums estructurados (ej. `@Roles(Role.Admin)`).
* **Confiar en la validación del Frontend:** Suponer que porque la aplicación móvil o web valida los campos, el backend no necesita volver a validarlos.

---

## 8. Modos de fallo del Auditor
* Si el FSD no especifica qué rol debe consumir un endpoint y el controlador no lo declara → El auditor debe marcarlo como advertencia de seguridad e interpelar al usuario para definir el caso en el FSD antes de aprobar el endpoint.
* Si el archivo DTO importado no se encuentra en el espacio de trabajo → Detener la auditoría y advertir sobre inconsistencias de imports.

---

## 9. Registro de cambios
| Versión | Fecha | Autor | Detalle del Cambio |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-05-20 | Grupo Activa360 | Creación del skill de auditoría de seguridad para endpoints de NestJS. |
