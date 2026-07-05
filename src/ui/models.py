from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class DashboardSummary:
    active_instances: int = 0
    pending_registration: int = 0
    pending_approval: int = 0
    approved: int = 0
    rejected: int = 0
    generated_actas: int = 0
    pending_tasks: int = 0


@dataclass(slots=True)
class TaskViewModel:
    instance_id: str
    process_name: str
    task_id: str
    task_name: str
    task_status: str
    assignee: str
    created_at: str
    priority: str = "normal"
    available_action: str = "review"


@dataclass(slots=True)
class ProcessDetailViewModel:
    instance_id: str
    asset_id: str
    status: str
    current_task: str
    execution_path: list[dict[str, Any]] = field(default_factory=list)
    variables: dict[str, Any] = field(default_factory=dict)
    incidents: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class ArtifactSnapshot:
    hierarchy_code: str | None = None
    qr_data: str | None = None
    label_text: str | None = None
    acta_number: str | None = None
    status: str = "PENDING"
