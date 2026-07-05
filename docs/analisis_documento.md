# 1. Análisis del documento documento_diseño_bpmn.md

## Arquitectura propuesta

El documento define un motor de workflow orientado a BPMN 2.0 como un sistema basado en grafos dirigidos. La arquitectura separa claramente:

- definición del workflow: Workflow, Task, LogicGate, Transition
- runtime: WorkflowInstance, TaskInstance, TraceEntry, Incident
- infraestructura operativa: cola, orquestador, workers, executor y recursos

## Entidades y contratos principales

- Workflow: plantilla del proceso.
- Task: nodo del grafo, con targets, incoming y logic_gate.
- LogicGate: estrategia de entrada para joins y decisiones.
- Transition: arista tipada FORWARD/BACKWARD.
- WorkflowInstance: ejecución de una definición.
- TaskInstance: estado concreto de una tarea en una instancia.
- Worker: responsable de ejecución.
- ResourceSpec/ResourceInstance: recursos requeridos y propagados.

## Impacto directo en el caso de activos fijos

Estas ideas se aplican directamente al proceso de registro de activos porque el flujo requiere:

- tareas humanas y automáticas;
- una decisión de aprobación/rechazo;
- un ciclo de corrección y reenvío;
- trazabilidad y auditoría;
- generación de documentos (código jerárquico, QR, acta).

## Ambigüedades resueltas

El documento no define explícitamente cómo modelar un proceso de negocio concreto como activos fijos. Para completarlo, se añadió una extensión mínima compatible con la arquitectura base:

- un modelo FixedAsset como dato de negocio asociado a la instancia;
- un workflow concreto con tareas de registro, aprobación, corrección y generación documental;
- una lógica de aprobación que hace que el rechazo vuelva a corrección y no genere documentos.
