from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from src.processes.fixed_assets import FixedAsset, create_fixed_asset_record
from src.runtime.engine import WorkflowEngine
from src.processes.fixed_assets import build_fixed_assets_workflow


@dataclass
class SimulationResult:
    asset_id: str
    approval_status: str
    process_status: str
    hierarchy_code: str | None
    qr_data: str | None
    acta_number: str | None
    trace: list[dict[str, Any]] = field(default_factory=list)


class WorkflowSimulator:
    def simulate(self, assets: list[FixedAsset], approval_decisions: dict[str, str | None] | None = None) -> list[SimulationResult]:
        workflow = build_fixed_assets_workflow()
        engine = WorkflowEngine(workflow)
        results: list[SimulationResult] = []
        for asset in assets:
            instance = engine.create_instance(asset=asset)
            decision = None
            if approval_decisions:
                decision = approval_decisions.get(asset.id)
            engine.run_until_completion(instance, approval_decision=decision)
            results.append(
                SimulationResult(
                    asset_id=asset.id,
                    approval_status=asset.approval_status,
                    process_status=asset.process_status,
                    hierarchy_code=asset.codigo_jerarquico,
                    qr_data=asset.qr_data,
                    acta_number=asset.acta_numero,
                    trace=[{"task_id": item.task_id, "status": item.status} for item in instance.execution_path],
                )
            )
        return results
