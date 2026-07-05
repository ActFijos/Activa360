# Motor BPMN para registro de activos fijos

Este proyecto implementa un motor de workflow tipo BPMN 2.0 alineado con el documento de diseño base en [documento_diseño_bpmn.md](documento_diseño_bpmn.md). Permite registrar activos fijos, gestionarlos mediante un flujo de aprobación, seguimiento de trazabilidad y generación de artefactos.

## Características

- Motor de workflow con instancias, tareas y trazabilidad.
- Proceso de activos fijos con aprobación, corrección y emisión de actas.
- Interfaz web para registrar activos y visualizar el estado del proceso.
- Pruebas automatizadas para validar el motor y la interfaz.

## Estructura del proyecto

- src/domain: modelo de dominio y enums.
- src/runtime: motor de ejecución y seguimiento.
- src/orchestration: cola y orquestación.
- src/processes: definición del proceso de activos fijos.
- src/ui: interfaz de usuario.
- src/web: interfaz web con Flask.
- tests: pruebas de integración y unitarias.

## Requisitos

- Python 3.12
- Dependencias del archivo pyproject.toml

## Instalación

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

## Ejecución rápida

```bash
python -m pytest -q
python -m src.main
python -m src.web.app
```

La interfaz web estará disponible en http://127.0.0.1:5000.

## Uso

1. Abrir la interfaz web en el navegador.
2. Registrar un activo fijo desde la ruta /register.
3. Revisar la bandeja de tareas, la trazabilidad y los artefactos generados.

