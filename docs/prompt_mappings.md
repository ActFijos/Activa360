# Mapeo de Prompts (Trazabilidad con Asistentes de IA)

Este documento registra los prompts clave utilizados con el asistente de IA para el desarrollo, diseño e implementación del motor de workflow BPMN 2.0 y su correspondencia con los artefactos producidos.

## Prompts de Desarrollo y Refactorización

### 1. Análisis y Alineación del Proyecto
* **Prompt:** *"tengo este proyecto y tengo que basarme en el documento bpmn-workflow-engine-design.md puedes revisarlo porfa"*
* **Resultado:** 
  * Análisis del estado del repositorio contra los requerimientos técnicos del diseño.
  * Identificación de los módulos existentes (modelos, motor síncrono, UI web de Flask) y detección de brechas críticas (concurrencia, orquestación por eventos/Observer, SLAs dinámicos).

### 2. Implementación de Concurrencia
* **Prompt:** *"Cual sería el siguiente paso? [Selección: Implementar la concurrencia con Executor y Future (usando threading o asyncio) y soporte para cancelación en reset]"*
* **Resultado:**
  * Diseño del plan de implementación en `implementation_plan.md`.
  * Creación del módulo [src/runtime/executor.py](../src/runtime/executor.py) con protocolos y la implementación de `ThreadedExecutor`.
  * Modificación de [src/domain/models.py](../src/domain/models.py) para que `can_start` en compuertas de tipo AND/OR espere sobre los futuros de tareas predecesoras.
  * Refactorización de [src/runtime/engine.py](../src/runtime/engine.py) agregando un semáforo de exclusión mutua (`threading.Lock`), encolado dinámico y cancelación activa de futuros en vuelo en `_apply_reset`.
  * Creación de pruebas concurrentes en [tests/test_concurrency.py](../tests/test_concurrency.py) y ejecución satisfactoria de los 7 tests del proyecto.

### 3. Distribución de Aportes del Grupo
* **Prompt:** *"el docente quiere que aclaremos el % de aporte de cada componente del grupo somos tres Guillermo Omar Daza Alcala Rita Nina y Josefina Rojas donde tendriamos que poner esos datos dentro del proyecto Josefina y Guillermo a 30 % y Rita 40 %"*
* **Resultado:**
  * Creación del archivo [APORTES.md](../APORTES.md) en la raíz del proyecto detallando los porcentajes y las contribuciones por componente de cada integrante.
  * Modificación del archivo [README.md](../README.md) en la raíz para incluir una sección directa que enlace al documento de aportes.

### 4. Publicación en GitHub
* **Prompt:** *"todo esto quiero subir al github de Activa 360 GitHub.com/ActFijos/Activa360 en un branch que tenga el nombre de BPMN"*
* **Resultado:**
  * Creación local del branch `BPMN`.
  * Staging y commit de todos los cambios de diseño, código e historial.
  * Vinculación del repositorio remoto `activa360` y subida del branch (`git push -u activa360 BPMN`).
