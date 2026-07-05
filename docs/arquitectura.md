# 3. Diseño de arquitectura de la solución

## Módulos

- src/domain: enums, modelos y dataclasses del motor BPMN
- src/runtime: WorkflowEngine, WorkflowInstance, TaskInstance, trazabilidad
- src/orchestration: cola de tareas y asignación de workers
- src/processes: modelo del proceso de activos fijos
- src/simulation: simulación de múltiples instancias
- tests: pruebas unitarias e integración

## Clases principales

- Workflow / Task / LogicGate / Transition
- WorkflowInstance / TaskInstance / Incident / TraceEntry
- Worker / ResourceSpec / ResourceInstance
- WorkflowEngine
- FixedAsset / build_fixed_assets_workflow

## Patrones aplicados

- Strategy: LogicGate encapsula la decisión de entrada
- Observer-like: la cola y el orquestador reaccionan a eventos de avance
- Definition/Instance: separación entre plantilla y ejecución
- Domain-driven design: el modelo de negocio es independiente del motor
