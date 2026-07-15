# PR Implementation: Soporte de Concurrencia (Executor y Future)

Este documento detalla la implementación del soporte de concurrencia y ejecución paralela del motor BPMN, registrando los cambios de diseño y código de la característica.

## Descripción del Feature
El objetivo de este feature es añadir soporte para la ejecución de tareas en paralelo utilizando las abstracciones de `Executor` y `Future`, alineándose con la especificación de diseño del motor BPMN. 

## Cambios de Diseño y Decisiones Técnicas

1. **Modelo de Hilos:** Se optó por `threading` de la biblioteca estándar de Python y `ThreadPoolExecutor` como backend para el `Executor` por simplicidad de integración con el flujo síncrono existente.
2. **Sincronización:** Se introdujo un `threading.Lock` para proteger el acceso a las estructuras del motor (como `ready_queue`, `execution_path` e `instance.status`) ya que las tareas corren ahora en hilos secundarios.
3. **Bloqueos finos:** Para maximizar la concurrencia, las llamadas a los manejadores de tareas se realizan fuera de la adquisición del lock en `_process_task`.
4. **Espera en compuertas (Joins):** La evaluación en `can_start` bloquea la tarea destino llamando a `.result()` sobre los futuros en vuelo de las tareas predecesoras correspondientes si estas se encuentran activas en el workflow.
5. **Cancelación reactiva:** Al detectarse un incidente y aplicarse un reset en `_apply_reset`, todos los futuros activos de las tareas que vuelven a estado `PENDING` son cancelados inmediatamente mediante `future.cancel()`.

## Estructura de Archivos Afectados

* **[NEW] [src/runtime/executor.py](../src/runtime/executor.py):** Contiene la definición de protocolos y la implementación concreta de `ThreadedExecutor`.
* **[MODIFY] [src/domain/models.py](../src/domain/models.py):** Agrega el campo `active_futures` y actualiza `can_start` para esperar los futuros.
* **[MODIFY] [src/runtime/engine.py](../src/runtime/engine.py):** Integra la inicialización del executor, el bucle concurrente y la cancelación de futuros.
* **[NEW] [tests/test_concurrency.py](../tests/test_concurrency.py):** Suite de pruebas concurrentes para solapamiento temporal y cancelación en reset.
