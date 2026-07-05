from __future__ import annotations

from typing import Any

from src.ui.services import WorkflowUIService


class WorkflowUIController:
    """Controlador ligero para exponer operaciones de negocio a la UI."""

    def __init__(self, service: WorkflowUIService | None = None) -> None:
        self.service = service or WorkflowUIService()

    def register_asset(self, asset_data: dict[str, Any]):
        return self.service.start_asset_registration(asset_data)

    def approve_asset(self, instance, observations: str | None = None):
        return self.service.complete_human_task(instance, approval_decision="APROBADO", observations=observations)

    def reject_asset(self, instance, observations: str | None = None):
        return self.service.complete_human_task(instance, approval_decision="RECHAZADO", observations=observations)

    def resume_correction(self, instance):
        return self.service.resume_after_correction(instance, approval_decision="APROBADO")

    def dashboard_summary(self):
        return self.service.get_dashboard_summary()

    def pending_tasks(self):
        return self.service.list_pending_tasks()

    def process_detail(self, instance_id: str):
        return self.service.get_process_detail(instance_id)

    def artifact_snapshot(self, instance_id: str):
        return self.service.get_artifact_snapshot(instance_id)

    def instances(self):
        return self.service.list_instances()
