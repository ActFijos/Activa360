from __future__ import annotations

from typing import Any

from src.domain.models import WorkflowInstance, WorkflowStatus
from src.processes.fixed_assets import build_fixed_assets_workflow, create_fixed_asset_record
from src.runtime.engine import WorkflowEngine
from src.ui.models import ArtifactSnapshot, DashboardSummary, ProcessDetailViewModel, TaskViewModel


class WorkflowUIService:
    """Adaptador mínimo entre la interfaz y el motor BPMN."""

    def __init__(self) -> None:
        workflow = build_fixed_assets_workflow()
        self._engine = WorkflowEngine(workflow)
        self._instances: dict[str, WorkflowInstance] = {}
        self._current_instance_id: str | None = None

    def start_asset_registration(self, asset_data: dict[str, Any]) -> WorkflowInstance:
        asset = create_fixed_asset_record(
            asset_id=asset_data["asset_id"],
            nombre=asset_data["nombre"],
            categoria=asset_data.get("categoria", "OTRO"),
            subcategoria=asset_data.get("subcategoria", "OTRO"),
            descripcion=asset_data.get("descripcion", ""),
            marca=asset_data.get("marca", ""),
            modelo=asset_data.get("modelo", ""),
            numero_serie=asset_data.get("numero_serie", ""),
            estado=asset_data.get("estado", "NUEVO"),
            fecha_compra=asset_data.get("fecha_compra", ""),
            costo=float(asset_data.get("costo", 0.0)),
            proveedor=asset_data.get("proveedor", ""),
            ubicacion=asset_data.get("ubicacion", ""),
            responsable=asset_data.get("responsable", ""),
            observaciones=asset_data.get("observaciones", ""),
        )
        instance = self._engine.create_instance(asset=asset)
        self._instances[instance.id] = instance
        self._current_instance_id = instance.id
        self._engine.run_until_completion(instance, approval_decision=None, wait_for_human_decision=True)
        return instance

    def complete_human_task(self, instance: WorkflowInstance, approval_decision: str, observations: str | None = None) -> WorkflowInstance:
        if instance.asset is not None and observations:
            instance.asset.observaciones = observations
        self._engine.continue_after_human_decision(instance, approval_decision=approval_decision)
        return instance

    def resume_after_correction(self, instance: WorkflowInstance, approval_decision: str = "APROBADO") -> WorkflowInstance:
        self._engine.resume_after_correction(instance, approval_decision=approval_decision)
        return instance

    def get_dashboard_summary(self) -> DashboardSummary:
        summary = DashboardSummary()
        for instance in self._instances.values():
            asset = instance.asset
            if instance.status == WorkflowStatus.IN_PROGRESS:
                summary.active_instances += 1
            if asset is not None and asset.approval_status == "PENDIENTE":
                summary.pending_approval += 1
            if asset is not None and asset.approval_status == "APROBADO":
                summary.approved += 1
            if asset is not None and asset.approval_status == "RECHAZADO":
                summary.rejected += 1
            if asset is not None and asset.acta_numero:
                summary.generated_actas += 1
            if instance.current_task_instance is not None:
                summary.pending_tasks += 1
        summary.pending_registration = len(self._instances)
        return summary

    def list_pending_tasks(self) -> list[TaskViewModel]:
        tasks: list[TaskViewModel] = []
        for instance in self._instances.values():
            task = instance.current_task_instance
            if task is None:
                continue
            if task.status.value in {"COMPLETED", "CANCELLED"}:
                continue
            asset = instance.asset
            tasks.append(
                TaskViewModel(
                    instance_id=instance.id,
                    process_name=instance.definition.name,
                    task_id=task.definition.id,
                    task_name=task.definition.name,
                    task_status=task.status.value,
                    assignee=task.assigned_workers[0].name if task.assigned_workers else "Sin asignar",
                    created_at=task.started_at.isoformat() if task.started_at else "pending",
                    available_action="review" if task.definition.id == "task_approval" else "execute",
                )
            )
        return tasks

    def get_process_detail(self, instance_id: str) -> ProcessDetailViewModel:
        instance = self._instances[instance_id]
        return ProcessDetailViewModel(
            instance_id=instance.id,
            asset_id=instance.asset.id if instance.asset else "-",
            status=instance.status.value,
            current_task=instance.current_task_instance.definition.name if instance.current_task_instance else "-",
            execution_path=[{"task_id": entry.task_id, "status": entry.status, "iteration": entry.iteration} for entry in instance.execution_path],
            variables=dict(instance.variables),
            incidents=[{"id": incident.id, "reason": incident.reason, "to_task": incident.to_task.name} for incident in instance.incidents],
        )

    def get_artifact_snapshot(self, instance_id: str) -> ArtifactSnapshot:
        instance = self._instances[instance_id]
        asset = instance.asset
        if asset is None:
            return ArtifactSnapshot(status="PENDING")
        return ArtifactSnapshot(
            hierarchy_code=asset.codigo_jerarquico,
            qr_data=asset.qr_data,
            label_text=asset.etiqueta_impresion,
            acta_number=asset.acta_numero,
            status="READY" if asset.acta_numero else "PENDING",
        )

    def list_instances(self) -> list[WorkflowInstance]:
        return list(self._instances.values())
