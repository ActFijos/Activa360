from __future__ import annotations

import time
from datetime import datetime, timezone
import pytest
from src.domain.models import (
    DependencyMatrix,
    GateType,
    LogicGate,
    Task,
    TaskType,
    Workflow,
    WorkflowStatus,
)
from src.runtime.engine import WorkflowEngine


def test_parallel_execution_overlap(monkeypatch):
    """Prueba que tareas paralelas se ejecuten de forma concurrente."""
    # Tareas base
    t_start = Task(id="task_register", name="Registro", task_type=TaskType.HUMAN)
    t_p1 = Task(id="task_generate_hierarchy_code", name="P1 (Jerarquía)", task_type=TaskType.SERVICE)
    t_p2 = Task(id="task_generate_qr", name="P2 (QR)", task_type=TaskType.SERVICE)
    t_join = Task(id="task_print_label", name="Join Label", task_type=TaskType.SERVICE)
    t_final = Task(id="task_generate_acta", name="Acta Final", task_type=TaskType.END, is_final=True)

    # Conectar flujo
    t_start.targets = [t_p1, t_p2]
    t_p1.targets = [t_join]
    t_p2.targets = [t_join]
    t_join.targets = [t_final]

    t_start.incoming = []
    t_p1.incoming = [t_start]
    t_p2.incoming = [t_start]
    t_join.incoming = [t_p1, t_p2]
    t_final.incoming = [t_join]

    t_join.logic_gate = LogicGate(type=GateType.AND, depends_on=[t_p1, t_p2])
    t_final.logic_gate = LogicGate(type=GateType.AND, depends_on=[t_join])

    dep_matrix = DependencyMatrix()
    for task in [t_start, t_p1, t_p2, t_join, t_final]:
        for target in task.targets:
            dep_matrix.add_edge(task.id, target.id)

    workflow = Workflow(
        id="wf_concurrency",
        name="Workflow Concurrencia",
        version=1,
        start_task=t_start,
        final_tasks=[t_final],
        tasks=[t_start, t_p1, t_p2, t_join, t_final],
        dependency_matrix=dep_matrix,
    )

    timestamps = {}

    def mock_handle_hierarchy_code(self, task_instance, instance):
        timestamps["p1_start"] = time.time()
        time.sleep(0.1)
        timestamps["p1_end"] = time.time()

    def mock_handle_qr(self, task_instance, instance):
        timestamps["p2_start"] = time.time()
        time.sleep(0.1)
        timestamps["p2_end"] = time.time()

    # Sobrescribir los manejadores usando monkeypatch
    monkeypatch.setattr(WorkflowEngine, "_handle_hierarchy_code", mock_handle_hierarchy_code)
    monkeypatch.setattr(WorkflowEngine, "_handle_qr", mock_handle_qr)

    engine = WorkflowEngine(workflow)
    # Crear un asset mock básico para evitar errores de validación de los handlers reales
    class MockAsset:
        id = "MOCK-001"
        nombre = "Mock"
        process_status = "INICIADO"
        approval_status = "APROBADO"
        codigo_jerarquico = "CODE"
        qr_data = "QR"
        etiqueta_impresion = "LABEL"
        acta_numero = "ACTA"
        fecha_ingreso = None
        categoria = "TECNOLOGIA"

    asset = MockAsset()
    instance = engine.create_instance(asset=asset)

    # Ejecutar hasta completado
    engine.run_until_completion(instance)

    assert instance.status == WorkflowStatus.COMPLETED
    # Verificar que p1 y p2 se ejecutaron concurrentemente (los intervalos de tiempo se solapan)
    # Si fueran secuenciales, el inicio de una sería posterior o igual al fin de la otra.
    assert timestamps["p1_start"] < timestamps["p2_end"]
    assert timestamps["p2_start"] < timestamps["p1_end"]


def test_cancellation_during_reset(monkeypatch):
    """Prueba que los futuros de tareas en vuelo se cancelen al hacer reset por incidente."""
    t_start = Task(id="task_register", name="Registro", task_type=TaskType.HUMAN)
    t_long = Task(id="task_generate_hierarchy_code", name="Tarea Larga", task_type=TaskType.SERVICE)
    t_final = Task(id="task_generate_acta", name="Final", task_type=TaskType.END, is_final=True)

    t_start.targets = [t_long]
    t_long.targets = [t_final]

    t_start.incoming = []
    t_long.incoming = [t_start]
    t_final.incoming = [t_long]

    dep_matrix = DependencyMatrix()
    dep_matrix.add_edge(t_start.id, t_long.id)
    dep_matrix.add_edge(t_long.id, t_final.id)

    workflow = Workflow(
        id="wf_cancel",
        name="Workflow Cancelacion",
        version=1,
        start_task=t_start,
        final_tasks=[t_final],
        tasks=[t_start, t_long, t_final],
        dependency_matrix=dep_matrix,
    )

    is_cancelled = False

    def mock_handle_hierarchy_code(self, task_instance, instance):
        # Esta tarea simula un proceso largo que es cancelado
        nonlocal is_cancelled
        try:
            for _ in range(20):
                time.sleep(0.05)
        except Exception:
            is_cancelled = True
            raise

    monkeypatch.setattr(WorkflowEngine, "_handle_hierarchy_code", mock_handle_hierarchy_code)

    engine = WorkflowEngine(workflow)
    class MockAsset:
        id = "MOCK-002"
        nombre = "Mock"
        process_status = "INICIADO"
        approval_status = "APROBADO"
        codigo_jerarquico = "CODE"
        qr_data = "QR"
        etiqueta_impresion = "LABEL"
        acta_numero = "ACTA"
        fecha_ingreso = None
        categoria = "TECNOLOGIA"

    asset = MockAsset()
    instance = engine.create_instance(asset=asset)

    # Iniciamos en segundo plano
    import threading
    t = threading.Thread(target=engine.run_until_completion, args=(instance,))
    t.start()

    # Esperamos a que la tarea larga empiece y se registre su futuro
    time.sleep(0.1)
    assert "task_generate_hierarchy_code" in instance.active_futures

    # Levantamos un incidente artificial para forzar reset
    engine._raise_incident(
        instance,
        t_long,
        transition=None
    )

    # Aplicamos un reset manual
    from src.domain.models import Incident, IncidentType, ResetScope
    incident = Incident(
        id="inc-mock",
        from_task=t_long,
        to_task=t_start,
        type=IncidentType.QUALITY,
        reason="Reset de prueba",
        raised_by=engine.workers[0],
        timestamp=datetime.now(timezone.utc),
        iteration=1,
        reset_scope=ResetScope.ALL_DOWNSTREAM,
    )
    engine._apply_reset(instance, incident)

    # Esperamos a que el hilo termine
    t.join()

    # Verificamos que el futuro de la tarea larga fue cancelado
    assert "task_generate_hierarchy_code" not in instance.active_futures
