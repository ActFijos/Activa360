# Motor BPMN para registro de activos fijos

Este proyecto implementa un motor de workflow tipo BPMN 2.0 alineado con el documento de diseño base en [documento_diseño_bpmn.md](documento_diseño_bpmn.md).

## Estructura

- src/domain: modelo de dominio y enums
- src/runtime: instancias de ejecución y trazabilidad
- src/orchestration: cola, orquestador y workers
- src/processes: definición del proceso de activos fijos
- src/simulation: simulación operativa
- tests: pruebas de integración y unitarias

## Ejecución rápida

```bash
python -m pytest -q
python -m src.main
```
