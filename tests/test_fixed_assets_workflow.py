from datetime import datetime

from src.domain.models import (
    CompletionPolicy,
    GateType,
    LogicGate,
    ResourceSpec,
    ResourceType,
    Role,
    TaskStatus,
    TaskType,
    Transition,
    TransitionType,
    WorkflowStatus,
    Worker,
    WorkerType,
)
from src.processes.fixed_assets import build_fixed_assets_workflow, create_fixed_asset_record
from src.runtime.engine import WorkflowEngine


def test_approved_flow_completes_and_generates_documents():
    workflow = build_fixed_assets_workflow()
    engine = WorkflowEngine(workflow)
    asset = create_fixed_asset_record(
        asset_id="FA-001",
        nombre="Portátil Lenovo",
        categoria="Tecnología",
        subcategoria="Computación",
        descripcion="Portátil para laboratorios",
        marca="Lenovo",
        modelo="ThinkPad",
        numero_serie="ABC123",
        estado="NUEVO",
        fecha_compra="2026-01-15",
        costo=1500.0,
        proveedor="TechPro",
        ubicacion="Laboratorio 1",
        responsable="Ana",
        observaciones="Sin observaciones",
    )

    instance = engine.create_instance(asset=asset)
    engine.run_until_completion(instance)

    assert instance.status == WorkflowStatus.COMPLETED
    assert instance.current_task_instance is None
    assert asset.approval_status == "APROBADO"
    assert asset.codigo_jerarquico is not None
    assert asset.qr_data is not None
    assert asset.acta_numero is not None


def test_rejected_flow_returns_to_correction_and_then_approved():
    workflow = build_fixed_assets_workflow()
    engine = WorkflowEngine(workflow)
    asset = create_fixed_asset_record(asset_id="FA-002", nombre="Silla ergonómica")

    instance = engine.create_instance(asset=asset)
    engine.run_until_completion(instance, approval_decision="RECHAZADO")

    assert instance.status == WorkflowStatus.IN_PROGRESS
    assert asset.approval_status == "PENDIENTE"
    assert asset.process_status == "EN_CORRECCION"

    engine.resume_after_correction(instance, approval_decision="APROBADO")
    assert asset.approval_status == "APROBADO"
    assert asset.codigo_jerarquico is not None


def test_logic_gate_and_resources_are_respected():
    gate = LogicGate(type=GateType.AND, depends_on=[])
    assert gate.can_start(None, None) is True

    resource = ResourceSpec(key="documento", value="doc.pdf", type=ResourceType.FILE, mandatory=True)
    assert resource.mandatory is True
