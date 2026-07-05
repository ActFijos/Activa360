from __future__ import annotations

from src.domain.models import WorkflowStatus
from src.ui.services import WorkflowUIService


def test_service_can_start_and_resume_interactive_approval() -> None:
    service = WorkflowUIService()
    asset_data = {
        "asset_id": "FA-300",
        "nombre": "Monitor 27 pulgadas",
        "categoria": "Tecnología",
        "subcategoria": "Periféricos",
        "descripcion": "Pantalla para oficina",
        "marca": "LG",
        "modelo": "27UP850",
        "numero_serie": "SN-300",
        "estado": "NUEVO",
        "fecha_compra": "2026-03-01",
        "costo": 450.0,
        "proveedor": "Tecno SA",
        "ubicacion": "Oficina 5",
        "responsable": "Marta",
        "observaciones": "Sin observaciones",
    }

    instance = service.start_asset_registration(asset_data)
    assert instance.status == WorkflowStatus.IN_PROGRESS

    service.complete_human_task(instance, approval_decision="APROBADO")
    assert instance.asset is not None
    assert instance.asset.approval_status == "APROBADO"
    assert instance.asset.codigo_jerarquico is not None
