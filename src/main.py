from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.processes.fixed_assets import build_fixed_assets_workflow, create_fixed_asset_record
from src.runtime.engine import WorkflowEngine


def main() -> None:
    workflow = build_fixed_assets_workflow()
    engine = WorkflowEngine(workflow)

    approved_asset = create_fixed_asset_record(
        asset_id="FA-100",
        nombre="Computadora de escritorio",
        categoria="Tecnología",
        subcategoria="Hardware",
        descripcion="Equipo para oficina",
        marca="Dell",
        modelo="OptiPlex",
        numero_serie="SN-100",
        estado="NUEVO",
        fecha_compra="2026-01-10",
        costo=1200.0,
        proveedor="Informatica SA",
        ubicacion="Oficina 2",
        responsable="Carlos",
        observaciones="Sin observaciones",
    )
    approved_instance = engine.create_instance(asset=approved_asset)
    engine.run_until_completion(approved_instance, approval_decision="APROBADO")

    rejected_asset = create_fixed_asset_record(asset_id="FA-200", nombre="Silla ejecutiva")
    rejected_instance = engine.create_instance(asset=rejected_asset)
    engine.run_until_completion(rejected_instance, approval_decision="RECHAZADO")
    engine.resume_after_correction(rejected_instance, approval_decision="APROBADO")

    print("Activo aprobado:", approved_asset.approval_status, approved_asset.codigo_jerarquico, approved_asset.qr_data, approved_asset.acta_numero)
    print("Activo rechazado corregido:", rejected_asset.approval_status, rejected_asset.codigo_jerarquico, rejected_asset.qr_data, rejected_asset.acta_numero)


if __name__ == "__main__":
    main()
