from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from src.domain.models import (
    CompletionPolicy,
    DependencyMatrix,
    GateType,
    LogicGate,
    ResourceSpec,
    ResourceType,
    Task,
    TaskType,
    Transition,
    TransitionType,
    Workflow,
    WorkflowStatus,
    WorkerType,
)


@dataclass
class FixedAsset:
    id: str
    nombre: str
    categoria: str = "OTRO"
    subcategoria: str = "OTRO"
    descripcion: str = ""
    marca: str = ""
    modelo: str = ""
    numero_serie: str = ""
    estado: str = "NUEVO"
    fecha_compra: str = ""
    costo: float = 0.0
    proveedor: str = ""
    ubicacion: str = ""
    responsable: str = ""
    observaciones: str = ""
    codigo_jerarquico: Optional[str] = None
    qr_data: Optional[str] = None
    approval_status: str = "PENDIENTE"
    process_status: str = "REGISTRANDO"
    fecha_ingreso: Optional[str] = None
    acta_numero: Optional[str] = None
    etiqueta_impresion: Optional[str] = None


def create_fixed_asset_record(
    asset_id: str,
    nombre: str,
    categoria: str = "OTRO",
    subcategoria: str = "OTRO",
    descripcion: str = "",
    marca: str = "",
    modelo: str = "",
    numero_serie: str = "",
    estado: str = "NUEVO",
    fecha_compra: str = "",
    costo: float = 0.0,
    proveedor: str = "",
    ubicacion: str = "",
    responsable: str = "",
    observaciones: str = "",
) -> FixedAsset:
    return FixedAsset(
        id=asset_id,
        nombre=nombre,
        categoria=categoria,
        subcategoria=subcategoria,
        descripcion=descripcion,
        marca=marca,
        modelo=modelo,
        numero_serie=numero_serie,
        estado=estado,
        fecha_compra=fecha_compra,
        costo=costo,
        proveedor=proveedor,
        ubicacion=ubicacion,
        responsable=responsable,
        observaciones=observaciones,
    )


def build_fixed_assets_workflow() -> Workflow:
    register = Task(
        id="task_register",
        name="Registro del activo fijo",
        task_type=TaskType.HUMAN,
        required_worker_type=WorkerType.FINANCE,
        produced_resources=[ResourceSpec(key="asset", value="", type=ResourceType.TEXT, mandatory=True, propagate=True)],
        completion_policy=CompletionPolicy.ALL,
    )
    send_for_approval = Task(
        id="task_send_for_approval",
        name="Envío a aprobación del jefe",
        task_type=TaskType.SERVICE,
        required_worker_type=WorkerType.LOGISTICS,
        required_resources=[ResourceSpec(key="asset", value="", type=ResourceType.TEXT, mandatory=True)],
    )
    approval = Task(
        id="task_approval",
        name="Aprobación del jefe",
        task_type=TaskType.DECISION,
        required_worker_type=WorkerType.ADMIN,
        backward_transitions=[Transition(source=None, target=register, type=TransitionType.BACKWARD, max_retries=1, exhausted_status=WorkflowStatus.ERROR)],
    )
    correction = Task(
        id="task_correction",
        name="Corrección y reenvío",
        task_type=TaskType.HUMAN,
        required_worker_type=WorkerType.FINANCE,
    )
    hierarchy_code = Task(
        id="task_generate_hierarchy_code",
        name="Generación de código jerárquico",
        task_type=TaskType.SERVICE,
        required_worker_type=WorkerType.TECHNICAL,
    )
    qr = Task(
        id="task_generate_qr",
        name="Generación de código QR",
        task_type=TaskType.SERVICE,
        required_worker_type=WorkerType.TECHNICAL,
    )
    label = Task(
        id="task_print_label",
        name="Impresión para etiquetado manual",
        task_type=TaskType.SERVICE,
        required_worker_type=WorkerType.LOGISTICS,
    )
    acta = Task(
        id="task_generate_acta",
        name="Generación de acta de ingreso",
        task_type=TaskType.END,
        required_worker_type=WorkerType.ADMIN,
        is_final=True,
    )

    register.targets = [send_for_approval]
    send_for_approval.targets = [approval]
    approval.targets = [hierarchy_code, correction]
    correction.targets = [send_for_approval]
    hierarchy_code.targets = [qr]
    qr.targets = [label]
    label.targets = [acta]

    for task in [register, send_for_approval, approval, correction, hierarchy_code, qr, label, acta]:
        task.incoming = []

    register.incoming = []
    send_for_approval.incoming = [register]
    approval.incoming = [send_for_approval]
    correction.incoming = [approval]
    hierarchy_code.incoming = [approval]
    qr.incoming = [hierarchy_code]
    label.incoming = [qr]
    acta.incoming = [label]

    dependency_matrix = DependencyMatrix()
    for source_task in [register, send_for_approval, approval, correction, hierarchy_code, qr, label, acta]:
        for target_task in source_task.targets:
            dependency_matrix.add_edge(source_task.id, target_task.id)

    approval.logic_gate = LogicGate(type=GateType.COMPLEX, expression="approval_decision")
    hierarchy_code.logic_gate = LogicGate(type=GateType.AND, depends_on=[approval])
    qr.logic_gate = LogicGate(type=GateType.AND, depends_on=[hierarchy_code])
    label.logic_gate = LogicGate(type=GateType.AND, depends_on=[qr])
    acta.logic_gate = LogicGate(type=GateType.AND, depends_on=[label])

    workflow = Workflow(
        id="workflow_fixed_assets",
        name="Registro de activos fijos",
        version=1,
        start_task=register,
        final_tasks=[acta],
        tasks=[register, send_for_approval, approval, correction, hierarchy_code, qr, label, acta],
        dependency_matrix=dependency_matrix,
    )
    return workflow
