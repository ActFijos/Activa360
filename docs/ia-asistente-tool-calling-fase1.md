# Implementación de Asistente IA con Tool Calling para Sistema de Activos Fijos

## Contexto

Tengo un sistema web de gestión de activos fijos desarrollado actualmente y funcionando con una base de datos PostgreSQL.

El sistema ya cuenta con módulos de:

* Registro de activos
* Asignación de activos
* Transferencias
* Bajas
* Usuarios
* Reportes
* Administración

Se requiere incorporar dentro del menú **Ayuda** una nueva opción llamada:

**Asistente IA**

Este asistente debe utilizar inteligencia artificial con capacidad de **Tool Calling**, permitiendo que el modelo consulte información real del sistema mediante APIs internas seguras.

La implementación debe integrarse sobre la arquitectura existente sin modificar la lógica actual del sistema.

---

# Objetivo de la Fase 1

Crear un asistente IA capaz de responder consultas relacionadas con activos fijos utilizando herramientas (**tools**) conectadas al backend.

Las funcionalidades iniciales serán:

1. Consultar activos registrados.
2. Buscar activos mediante código QR o código patrimonial.
3. Consultar historial de movimientos de un activo.

---

# Requerimientos funcionales

## 1. Nueva opción en menú Ayuda

Agregar una nueva opción:

```text
Ayuda
│
├── Manuales
│
├── Preguntas frecuentes
│
└── Asistente IA
```

Al ingresar debe mostrarse una interfaz tipo chat.

Ejemplo:

**Usuario**

> Muéstrame los activos asignados al departamento de Sistemas.

**Asistente IA**

> Encontré 542 activos asignados al departamento de Sistemas.

---

# 2. Arquitectura propuesta

La solución debe seguir la siguiente arquitectura:

```text
Usuario
   |
   |
Frontend Web
   |
   |
Módulo Asistente IA
   |
   |
AI Gateway
   |
   |
Tool Calling Engine
   |
   |
Servicios Backend
   |
   |
PostgreSQL
```

## Consideración importante

La inteligencia artificial **NO debe acceder directamente a PostgreSQL**.

Todas las consultas deben realizarse mediante servicios backend controlados.

---

# 3. AI Gateway

Crear un componente encargado de:

* Recibir preguntas del usuario.
* Enviar contexto al modelo IA.
* Gestionar ejecución de herramientas.
* Registrar conversaciones.
* Validar permisos.
* Retornar respuestas al usuario.

Debe considerar:

* Usuario autenticado.
* Rol del usuario.
* Departamento.
* Permisos.
* Auditoría.

---

# 4. Catálogo inicial de Tools

## Tool 1: consultar_activos

### Objetivo

Consultar activos registrados en el sistema.

### Parámetros

```json
{
  "area": "string",
  "tipoActivo": "string",
  "estado": "string",
  "responsable": "string"
}
```

### Ejemplo

Pregunta:

> ¿Cuántas computadoras tiene Sistemas?

La IA ejecuta:

```text
consultar_activos(
   area="Sistemas",
   tipoActivo="Computadora"
)
```

Respuesta esperada:

```text
Área: Sistemas

Total activos: 542

Computadoras: 230
Monitores: 210
Otros: 102
```

---

# Tool 2: buscar_activo_qr

## Objetivo

Encontrar un activo mediante:

* Código QR.
* Código patrimonial.
* Código interno.

## Parámetros

```json
{
  "codigo": "string"
}
```

## Ejemplo

Usuario:

> Busca el activo QR 009823.

Respuesta:

```text
Activo encontrado:

Código:
009823

Descripción:
Laptop Dell Latitude

Responsable:
Juan Pérez

Ubicación:
Edificio Administrativo

Estado:
Asignado
```

---

# Tool 3: obtener_historial_activo

## Objetivo

Consultar movimientos históricos del activo.

## Parámetros

```json
{
  "activoId": "number"
}
```

## Respuesta esperada

```text
Historial del activo:

2024-01-15
Asignado a Juan Pérez

2025-04-20
Transferido a Sistemas

2026-02-10
Mantenimiento realizado
```

---

# 5. Seguridad y permisos

El asistente debe respetar los permisos existentes del sistema.

Cada consulta debe validar:

* Usuario.
* Rol.
* Área.
* Permisos asignados.

Ejemplo:

## Usuario estándar

Puede consultar:

```text
Mis activos asignados
```

## Jefe de área

Puede consultar:

```text
Activos de su departamento
```

## Administrador

Puede consultar:

```text
Todos los activos del sistema
```

---

# 6. Auditoría

Crear una tabla para registrar interacción con IA.

Nombre sugerido:

```sql
AI_CONVERSATIONS
```

Campos sugeridos:

```sql
id
usuario_id
pregunta
respuesta
tool_utilizada
parametros_tool
fecha
duracion
```

Debe registrar:

* Pregunta realizada.
* Usuario que realizó la consulta.
* Tool ejecutada.
* Parámetros utilizados.
* Resultado obtenido.
* Fecha y hora.

---

# 7. Consideraciones técnicas

La solución debe permitir futuras ampliaciones:

* Generación automática de reportes.
* Solicitudes de transferencia.
* Creación de tickets.
* Análisis preventivo de activos.
* Identificación de activos sin mantenimiento.
* Integración con documentación mediante RAG.

---

# 8. Entregables esperados

El desarrollo debe entregar:

## Diseño

* Arquitectura técnica.
* Flujo de comunicación IA - Backend.
* Modelo de seguridad.

## Backend

* Nuevos endpoints.
* Servicios para tools.
* Validación de permisos.
* Auditoría.

## Frontend

* Nueva opción Asistente IA.
* Interfaz conversacional.
* Manejo de respuestas.

## IA

* Configuración del modelo.
* Definición de herramientas.
* Manejo de contexto.

## Pruebas

* Pruebas funcionales.
* Pruebas de seguridad.
* Validación de respuestas.

---

# Evolución futura

El asistente debe diseñarse como un componente extensible que permita agregar nuevas capacidades:

```text
Fase 1
 |
 +-- Consultar activos
 +-- Buscar por QR
 +-- Consultar historial


Fase 2
 |
 +-- Generar reportes
 +-- Explicar procesos


Fase 3
 |
 +-- Ejecutar transferencias
 +-- Crear solicitudes
 +-- Recomendaciones inteligentes
```

---

# Recomendación de diseño

El asistente debe manejar contexto del módulo donde se encuentra el usuario.

Ejemplo:

Si el usuario está en:

```text
Activos
   └── Transferencias
```

Enviar contexto:

```json
{
  "modulo": "Transferencias",
  "pantalla": "Nueva transferencia",
  "usuario": "jefe_activos"
}
```

Esto permitirá que la IA responda de forma contextual y no como un chatbot genérico.
