# Diseño de la interfaz de usuario para el motor BPMN de activos fijos

## 1. Análisis del documento base enfocado en la IU

La especificación oficial en documento_diseño_bpmn.md define un motor BPMN orientado a grafos dirigidos con separación entre definición y runtime. Para la IU, eso implica:

- El motor expone procesos como workflows, tareas y estados de ejecución.
- La interfaz no debe reproducir la lógica BPMN ni duplicar reglas; debe operar sobre el motor.
- Las pantallas deben reflejar tareas humanas, estados, trazabilidad, incidentes y artefactos generados.

### Módulos del motor que impactan a la IU

- Workflow / WorkflowInstance: para mostrar el estado del proceso.
- Task / TaskInstance: para mostrar la tarea activa, su estado y su responsable.
- LogicGate: para entender si una tarea está habilitada o bloqueada por un join.
- Resource / ResourceInstance: para visualizar recursos propagados y artefactos.
- Incident: para mostrar rechazos, rework y reset.
- TraceEntry: para mostrar trazabilidad y ciclos.

### Restricciones de diseño que impone el documento

- La IU debe consumir el motor sin redefinir la arquitectura.
- Las decisiones de aprobación/rechazo deben fluir hacia el motor como decisiones de negocio.
- La interfaz debe reflejar estados de workflow y task, no solo formularios.
- El flujo de activos fijos se debe mostrar como: registro → aprobación → generación de documentos → finalización.

## 2. Casos de uso de la interfaz

1. Registrar un activo fijo.
2. Iniciar una instancia del workflow.
3. Visualizar el dashboard con métricas básicas.
4. Consultar la bandeja de tareas del usuario actual.
5. Revisar un activo para aprobar o rechazar.
6. Revisar trazabilidad del proceso.
7. Consultar artefactos generados.
8. Reanudar un proceso tras corrección.

## 3. Arquitectura de la capa UI

Se implementa una arquitectura simple pero modular y compatible con el motor:

- ui/models.py: modelos de vista y snapshots.
- ui/services.py: adaptador de interfaz con el motor BPMN.
- ui/controllers.py: controladores para exponer operaciones a la interfaz.
- ui/widgets.py: componentes reutilizables de Tkinter.
- ui/app.py: aplicación principal.

### Patrón recomendado

Se utiliza un patrón MVC ligero:

- Modelos: estructuras de datos de vista y estado.
- View: widgets y pantallas de Tkinter.
- Controller: orquesta solicitudes del usuario hacia los servicios.

## 4. Mapa de pantallas y navegación

- Dashboard principal.
- Registro de activo fijo.
- Bandeja de tareas.
- Aprobación del jefe.
- Detalle del proceso BPMN.
- Artefactos generados.

La navegación es lateral vía botones de menú y cada acción actualiza el estado del workflow en tiempo real a través del adaptador de servicios.

## 5. Diseño detallado de cada pantalla

### Dashboard

- Resumen ejecutivo de procesos activos, pendientes de aprobación, aprobados y actas generadas.
- Tabla con instancias abiertas y tarea actual.

### Registro

- Formulario con datos del activo fijo.
- Validación mínima de campos obligatorios.
- Al enviar, se crea una instancia del workflow y se inicia el proceso.

### Bandeja de tareas

- Lista de tareas pendientes asociadas al proceso.
- Estado actual, responsable y acción disponible.

### Aprobación

- Vista para revisar los datos del activo.
- Observaciones para rechazo o corrección.
- Botones para aprobar, rechazar o reanudar tras corrección.

### Detalle del proceso

- Traza del workflow con estados y números de iteración.
- Muestra incidencias y variables del proceso.

### Artefactos

- Código jerárquico, QR, etiqueta y acta de ingreso.
- Estado visible de generación.

## 6. Integración IU ↔ Motor BPMN

La IU se integra con el motor a través del servicio WorkflowUIService.

Operaciones expuestas:

- start_asset_registration(asset_data)
- complete_human_task(instance, approval_decision, observations)
- resume_after_correction(instance)
- get_dashboard_summary()
- list_pending_tasks()
- get_process_detail(instance_id)
- get_artifact_snapshot(instance_id)

La interfaz no implementa lógica BPMN compleja; delega en el motor.

## 7. Estructura de carpetas del proyecto UI

```text
src/
  ui/
    __init__.py
    app.py
    controllers.py
    models.py
    services.py
    widgets.py
```

## 8. Implementación base en Python 3.12

La implementación base ya está disponible en:

- [src/ui/app.py](src/ui/app.py)
- [src/ui/controllers.py](src/ui/controllers.py)
- [src/ui/services.py](src/ui/services.py)
- [src/ui/models.py](src/ui/models.py)
- [src/ui/widgets.py](src/ui/widgets.py)

## 9. Explicación del código

- app.py: ventana principal, navegación y pantallas base.
- services.py: adaptador entre la UI y el motor.
- controllers.py: operaciones reutilizables desde las pantallas.
- models.py: estructuras de vista para dashboard, tareas y artefactos.
- widgets.py: componentes reutilizables de interfaz.

## 10. Recomendaciones de mejora futura

- Migrar a PySide6 o PyQt6 para mejor escalabilidad visual.
- Añadir persistencia de instancia y sesiones de usuario.
- Incorporar un panel de monitoreo con métricas avanzadas.
- Agregar soporte para edición de tareas, reasignación de workers y eventos de SLA.
