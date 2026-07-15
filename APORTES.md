# Aportes del Grupo de Trabajo

Este documento detalla la contribución individual y el porcentaje de aporte de cada uno de los integrantes del grupo para el desarrollo y diseño del Motor de Workflow tipo BPMN 2.0.

## Integrantes y Porcentaje de Aporte

| Integrante | Rol / Componentes de Responsabilidad | % de Aporte |
| :--- | :--- | :---: |
| **Rita Nina** | Modelo de dominio en inglés, lógica de incidentes, transiciones `BACKWARD` y reset. | **40%** |
| **Guillermo Omar Daza Alcala** | Cola de listos, orquestador básico, e integraciones Mock (servicios de QR, códigos y etiquetas). | **30%** |
| **Josefina Rojas** | Pruebas de integración, verificación de escenarios, interfaz de usuario y documentación. | **30%** |

## Detalle de Contribuciones

* **Rita Nina (40%):**
  * Definición inicial y estructuración de los modelos de dominio (`Workflow`, `Task`, `Transition`, `LogicGate`, `Incident`, `Worker`) en [models.py](src/domain/models.py).
  * Implementación de la lógica de resets configurable (`ALL_DOWNSTREAM` / `SPECIFIC`) y reintentos máximos por transición.
  * Diseño conceptual de la máquina de estados.

* **Guillermo Omar Daza Alcala (30%):**
  * Estructuración del motor en [engine.py](src/runtime/engine.py) y cola de ejecución.
  * Lógica para el mock de integraciones (código jerárquico, QR, impresión de etiqueta y acta final).
  * Soporte inicial de concurrencia y ejecución de tareas.

* **Josefina Rojas (30%):**
  * Creación y ejecución de la suite de pruebas unitarias y de integración en `tests/`.
  * Desarrollo y adaptación de la interfaz web interactiva basada en Flask y diseño de la interfaz gráfica local.
  * Mantenimiento de la documentación del proyecto (PRD, FSD y mapeo de procesos).
