# Functional Specification Document (FSD) – Motor de Workflow para Registro de Activos Fijos

> **Propósito del FSD**: traducir el PRD en una especificación técnica funcional detallada, describiendo cómo debe comportarse el sistema, sus componentes, reglas y mecanismos de ejecución para cumplir el proceso de registro de activos fijos.
>
> Audiencia: Ingeniería, Diseño técnico, QA, Docencia.

---

## 0. Metadatos

| Campo | Valor |
|-------|-------|
| Producto | Motor de workflow para registro de activos fijos |
| Documento base | docs/PRD.md |
| Grupo | G1 |
| Versión | v0.1 |
| Fecha | 04/07/2026 |
| Autor | Equipo de desarrollo |
| Revisores | Docente + Tech Lead + QA |
| Estado | Borrador |
| Stack | Python 3.12, dataclasses, Enum, type hints |
| Persistencia | En memoria (versión inicial) |
| Prompts utilizados | N/A |

## 1. Resumen funcional

El sistema implementa un motor de workflow tipo BPMN inspirado en la teoría de grafos para ejecutar el proceso institucional de registro de activos fijos. El flujo inicia con el registro del activo, continúa con la revisión del jefe, permite aprobación o rechazo con devolución a corrección, y solo cuando la aprobación es válida genera el código jerárquico, el código QR, la impresión para etiquetado manual y el acta de ingreso. La especificación se apoya en la separación entre definición del workflow y ejecución de instancias, con trazabilidad completa y capacidad de ejecución concurrente básica.

## 2. Objetivos técnicos del FSD

| ID | Objetivo técnico | PRD vinculado |
|----|------------------|---------------|
| FSD-01 | Definir el modelo de dominio del workflow y de las instancias | PRD-REQ-001 |
| FSD-02 | Implementar el flujo de registro, aprobación y corrección | PRD-REQ-002, PRD-REQ-003 |
| FSD-03 | Implementar la generación de artefactos documentales solo tras aprobación válida | PRD-REQ-004, PRD-REQ-005 |
| FSD-04 | Registrar trazabilidad y estados de cada transición | PRD-REQ-006 |

## 3. Alcance funcional técnico

### 3.1 Dentro del alcance

- Definición de un workflow de activos fijos como grafo dirigido.
- Creación de instancias de proceso por activo.
- Manejo de estados de tareas y del workflow.
- Evaluación de decisiones de aprobación/rechazo.
- Reenvío a corrección por rechazo.
- Generación de documentos y acta.
- Trazabilidad de ejecución y auditoría mínima.
- Simulación de múltiples instancias.

### 3.2 Fuera del alcance

- Persistencia en base de datos relacional o documental.
- Integración con sistemas externos de inventario.
- Interfaz web o panel administrativo.
- Importación/exportación BPMN XML.

## 4. Modelo de dominio

### 4.1 Entidades de definición

- Workflow: plantilla del proceso.
- Task: nodo del flujo.
- LogicGate: estrategia de entrada para joins/decisiones.
- Transition: arista entre tareas, con tipo FORWARD/BACKWARD.
- ResourceSpec: recursos que requiere o produce una tarea.
- Worker: responsable asignado a una tarea.

### 4.2 Entidades de ejecución

- WorkflowInstance: instancia concreta de un workflow.
- TaskInstance: ejecución concreta de una tarea.
- ResourceInstance: recurso real asociado a la tarea.
- TraceEntry: entrada de trazabilidad.
- Incident: incidente asociado a un rechazo o retorno.

### 4.3 Entidades de negocio

- FixedAsset: activo fijo registrado, con atributos como nombre, categoría, subcategoría, descripción, marca, modelo, número de serie, estado, fecha de compra, costo, proveedor, ubicación, responsable, observaciones, código jerárquico, QR, acta y estado de aprobación.

## 5. Reglas funcionales y de negocio

### 5.1 Reglas de flujo

1. El proceso inicia con el registro del activo.
2. El registro se envía a aprobación del jefe.
3. Si el jefe aprueba, se continúa con la generación documental.
4. Si el jefe rechaza, el trámite vuelve a corrección y puede reenviarse a aprobación.
5. No se genera código jerárquico, QR ni acta si el activo no está aprobado.
6. El acta solo puede generarse cuando el activo ya fue aprobado, tiene código jerárquico y QR.
7. Toda transición de estado debe quedar registrada en la trazabilidad.
8. Se pueden procesar varios activos en paralelo como instancias distintas.

### 5.2 Reglas de datos

- Los campos obligatorios mínimos deben estar completos para iniciar el trámite.
- Los datos opcionales pueden registrarse si se aportan.
- El estado del proceso debe reflejar la etapa actual del activo.
- Cada cambio de estado debe dejar constancia en la trazabilidad.

## 6. Diseño del flujo BPMN

### 6.1 Nodos del workflow

- Inicio: registro del activo.
- Tarea 1: Registro del activo fijo.
- Tarea 2: Envío a aprobación del jefe.
- Tarea 3: Aprobación del jefe.
- Tarea 4: Corrección y reenvío.
- Tarea 5: Generación de código jerárquico.
- Tarea 6: Generación de código QR.
- Tarea 7: Impresión para etiquetado manual.
- Tarea 8: Generación de acta de ingreso.
- Fin: cierre del workflow.

### 6.2 Transiciones

- Registro → Envío a aprobación.
- Envío a aprobación → Aprobación.
- Aprobación aprobada → Generación de código jerárquico.
- Aprobación rechazada → Corrección.
- Corrección → Envío a aprobación.
- Generación de código jerárquico → QR.
- QR → Etiqueta.
- Etiqueta → Acta.

### 6.3 Compuertas y decisiones

- La decisión de aprobación/rechazo se modela como una tarea de decisión con evaluación de una variable externa del flujo.
- La lógica de convergencia se implementa mediante la tarea destino y la evaluación de estado del activo.

## 7. Arquitectura del sistema

### 7.1 Módulos

- domain: modelos y enums del dominio BPMN.
- runtime: ejecución, instancias y trazabilidad.
- orchestration: cola de tareas, asignación de workers y orquestación.
- processes: definición del workflow específico de activos fijos.
- simulation: simulación de múltiples instancias.
- tests: pruebas unitarias e integración.

### 7.2 Responsabilidades por módulo

| Módulo | Responsabilidad |
|--------|-----------------|
| domain | Definir clases, enums y tipos del modelo BPMN |
| runtime | Crear y ejecutar instancias del workflow, registrar eventos |
| orchestration | Encolar tareas, asignar workers y controlar la ejecución |
| processes | Declarar el workflow de registro de activos fijos |
| simulation | Ejecutar simulaciones sobre varias instancias |
| tests | Validar el comportamiento del motor y del proceso |

## 8. Diseño de datos

### 8.1 Estructura del activo fijo

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | str | sí | identificador del activo |
| nombre | str | sí | nombre del activo |
| categoría | str | sí | tipo de bien |
| subcategoría | str | no | clasificación adicional |
| descripción | str | no | detalle del bien |
| marca | str | no | marca del activo |
| modelo | str | no | modelo del activo |
| número de serie | str | no | número único |
| estado | str | no | estado del bien |
| fecha de compra | str | no | fecha de adquisición |
| costo | float | no | valor de compra |
| proveedor | str | no | proveedor |
| ubicación | str | no | lugar asignado |
| responsable | str | no | responsable del bien |
| observaciones | str | no | notas adicionales |
| código jerárquico | str | no | código institucional |
| qr_data | str | no | datos usados para el QR |
| approval_status | str | sí | estado de aprobación |
| process_status | str | sí | estado del workflow |
| fecha_ingreso | str | no | fecha del ingreso |
| acta_numero | str | no | número de acta |

## 9. Comportamiento del motor

### 9.1 Ciclo de vida de una instancia

1. Se crea una instancia del workflow para un activo fijo.
2. Se encola la tarea inicial.
3. El motor procesa la tarea actual y actualiza su estado.
4. Si la tarea requiere aprobación o decisión, se evalúa la variable de decisión.
5. Se navega a las tareas destino correspondientes.
6. Se registran trazas y eventos del proceso.
7. Cuando se alcanza la tarea final, el workflow termina.

### 9.2 Asignación de workers

- Cada tarea puede tener un worker tipo asociado.
- El motor asigna el worker disponible más apropiado para la tarea.
- En la implementación inicial se usa una asignación simple por especialidad.

### 9.3 Cola de tareas

- Se usa una cola simple de tareas listos, inspirada en el diseño del documento base.
- Las tareas pasan por READY → ASSIGNED → IN_PROGRESS → COMPLETED.
- El proceso puede ejecutarse de forma secuencial o mediante simulación de múltiples instancias.

## 10. Trazabilidad y auditoría

El motor debe registrar al menos lo siguiente:

- identificador de la instancia,
- tarea ejecutada,
- estado alcanzado,
- marca de tiempo,
- incidente si aplica,
- si la tarea fue reiniciada o volvió a PENDING por reset.

La trazabilidad se implementa como una lista append-only de TraceEntry y una lista de Incident por instancia.

## 11. Reglas de generación de documentos

### 11.1 Código jerárquico

Se genera solo si el activo está aprobado.

### 11.2 Código QR

Se genera solo si el activo está aprobado.

### 11.3 Etiqueta manual

Se genera como salida textual para impresión.

### 11.4 Acta de ingreso

Se genera solo si el activo está aprobado, cuenta con código jerárquico y con QR.

## 12. Casos de prueba funcionales

| ID | Caso | Resultado esperado |
|----|------|--------------------|
| FSD-TEST-001 | Activo aprobado | Se generan código, QR, etiqueta y acta |
| FSD-TEST-002 | Activo rechazado | Se devuelve a corrección y no se generan documentos finales |
| FSD-TEST-003 | Activo corregido y re-aprobado | Se completa el workflow y se generan documentos |
| FSD-TEST-004 | Trazabilidad | Se registran eventos y estados de forma ordenada |
| FSD-TEST-005 | Múltiples instancias | Se pueden ejecutar varios activos en paralelo o en simulación |

## 13. Supuestos y decisiones de diseño

- La persistencia inicial se implementa en memoria.
- La integración con bases de datos u otros sistemas queda como mejora futura.
- La prioridad principal es demostrar el motor, la lógica del workflow y la trazabilidad.

## 14. Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| Complejidad en la lógica de joins | simplificación mediante lógica embebida en tareas destino |
| Falta de persistencia durable | documentación como mejora futura |
| Ambigüedad en el rechazo/corrección | reglas claras de reenvío y trazabilidad |

## 15. Trazabilidad PRD → FSD

| PRD ID | FSD ID |
|--------|--------|
| PRD-REQ-001 | FSD-01 |
| PRD-REQ-002 | FSD-02 |
| PRD-REQ-003 | FSD-02 |
| PRD-REQ-004 | FSD-03 |
| PRD-REQ-005 | FSD-03 |
| PRD-REQ-006 | FSD-04 |

## 16. Registro de cambios

| Versión | Fecha | Autor | Cambio |
|---------|-------|-------|--------|
| v0.1 | 04/07/2026 | Equipo | Versión inicial del FSD |
