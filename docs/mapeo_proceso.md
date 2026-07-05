# 2. Mapeo del proceso de activos fijos al motor BPMN

## Workflow completo

1. Registro del activo fijo
2. Envío a aprobación del jefe
3. Aprobación del jefe
4. Si se aprueba: generar código jerárquico, QR, etiqueta y acta
5. Si se rechaza: volver a corrección y reabrir el flujo para aprobación

## Elementos del workflow

- Evento inicial: tarea inicial de registro
- Tarea humana: registro del activo
- Tarea de servicio: envío a aprobación
- Tarea de decisión: aprobación del jefe
- Gateway implícito: la lógica de decisión está embebida en la tarea de aprobación
- Tarea de corrección: reenvío tras rechazo
- Tareas automáticas: generación de documentos
- Evento final: generación del acta

## Flujo feliz

Registro -> envío a aprobación -> aprobación -> código jerárquico -> QR -> etiqueta -> acta

## Flujo alternativo

Registro -> envío a aprobación -> aprobación rechazada -> corrección -> reenvío a aprobación -> aprobación aprobada -> documentos
