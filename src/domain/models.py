from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional


class WorkflowStatus(Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    SUSPENDED = "SUSPENDED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ERROR = "ERROR"


class TaskStatus(Enum):
    PENDING = "PENDING"
    READY = "READY"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    TIMED_OUT = "TIMED_OUT"
    CANCELLED = "CANCELLED"


class GateType(Enum):
    AND = "AND"
    OR = "OR"
    XOR = "XOR"
    COMPLEX = "COMPLEX"
    SCRIPT = "SCRIPT"
    REST = "REST"
    LAMBDA = "LAMBDA"


class ResourceType(Enum):
    FILE = "FILE"
    TEXT = "TEXT"
    URL = "URL"
    OTHER = "OTHER"


class TaskType(Enum):
    HUMAN = "HUMAN"
    SERVICE = "SERVICE"
    SCRIPT = "SCRIPT"
    DECISION = "DECISION"
    START = "START"
    END = "END"


class Role(Enum):
    WORKER = "WORKER"
    ADMIN = "ADMIN"


class TransitionType(Enum):
    FORWARD = "FORWARD"
    BACKWARD = "BACKWARD"


class IncidentType(Enum):
    QUALITY = "QUALITY"
    VALIDATION = "VALIDATION"
    MISSING_RESOURCE = "MISSING_RESOURCE"
    BUSINESS_RULE = "BUSINESS_RULE"
    OTHER = "OTHER"


class CompletionPolicy(Enum):
    ALL = "ALL"
    ANY = "ANY"
    QUORUM = "QUORUM"


class WorkerType(Enum):
    ADMIN = "ADMIN"
    FINANCE = "FINANCE"
    LOGISTICS = "LOGISTICS"
    TECHNICAL = "TECHNICAL"


class ResetScope(Enum):
    ALL_DOWNSTREAM = "ALL_DOWNSTREAM"
    SPECIFIC = "SPECIFIC"


@dataclass
class DependencyMatrix:
    adjacency: dict[str, set[str]] = field(default_factory=dict)

    def add_edge(self, source: str, target: str) -> None:
        self.adjacency.setdefault(source, set()).add(target)
        self.adjacency.setdefault(target, set())

    def has_path(self, source: str, target: str) -> bool:
        if source == target:
            return True
        visited: set[str] = set()
        stack = [source]
        while stack:
            current = stack.pop()
            if current == target:
                return True
            for nxt in self.adjacency.get(current, set()):
                if nxt not in visited:
                    visited.add(nxt)
                    stack.append(nxt)
        return False


@dataclass
class ResourceSpec:
    key: str
    value: str
    type: ResourceType
    mandatory: bool = False
    propagate: bool = False


@dataclass
class LogicGate:
    type: GateType
    depends_on: list["Task"] = field(default_factory=list)
    expression: Optional[str] = None
    endpoint: Optional[str] = None

    def can_start(self, target: "TaskInstance | None", ctx: "WorkflowInstance | None") -> bool:
        if ctx is None:
            return True
        completed_tasks = set(ctx.variables.get("completed_tasks", []))
        if not self.depends_on:
            return True
        if self.type == GateType.AND:
            return all(task.id in completed_tasks for task in self.depends_on)
        if self.type == GateType.OR:
            return any(task.id in completed_tasks for task in self.depends_on)
        if self.type == GateType.XOR:
            return sum(1 for task in self.depends_on if task.id in completed_tasks) == 1
        if self.type == GateType.COMPLEX:
            return ctx.variables.get("approval_decision") == "APROBADO"
        return True


@dataclass
class Transition:
    source: "Task | None"
    target: "Task | None"
    type: TransitionType = TransitionType.FORWARD
    max_retries: Optional[int] = None
    exhausted_status: WorkflowStatus = WorkflowStatus.ERROR
    error_code: Optional[str] = None


@dataclass(eq=False)
class Task:
    id: str
    name: str
    targets: list["Task"] = field(default_factory=list)
    incoming: list["Task"] = field(default_factory=list)
    backward_transitions: list[Transition] = field(default_factory=list)
    logic_gate: Optional[LogicGate] = None
    required_resources: list[ResourceSpec] = field(default_factory=list)
    produced_resources: list[ResourceSpec] = field(default_factory=list)
    required_worker_type: Optional[WorkerType] = None
    task_type: TaskType = TaskType.HUMAN
    is_final: bool = False
    completion_policy: CompletionPolicy = CompletionPolicy.ALL
    quorum: Optional[int] = None
    max_time_to_assign: Optional[timedelta] = None
    max_time_to_complete: Optional[timedelta] = None


@dataclass
class Workflow:
    id: str
    name: str
    version: int
    start_task: Task
    final_tasks: list[Task] = field(default_factory=list)
    tasks: list[Task] = field(default_factory=list)
    dependency_matrix: DependencyMatrix = field(default_factory=DependencyMatrix)
    status: WorkflowStatus = WorkflowStatus.PENDING


@dataclass(frozen=True)
class Worker:
    id: str
    name: str
    specialty: WorkerType
    capacity: int = 1
    role: Role = Role.WORKER


@dataclass
class ResourceInstance:
    spec: ResourceSpec
    value: str


@dataclass
class TraceEntry:
    task_id: str
    status: str
    timestamp: datetime
    iteration: int = 1
    incident_id: Optional[str] = None
    was_reset: bool = False


@dataclass
class Incident:
    id: str
    from_task: Task
    to_task: Task
    type: IncidentType
    reason: str
    raised_by: Worker
    timestamp: datetime
    iteration: int
    reset_scope: ResetScope = ResetScope.ALL_DOWNSTREAM
    reset_targets: list[Task] = field(default_factory=list)


@dataclass
class TaskInstance:
    id: str
    definition: Task
    status: TaskStatus = TaskStatus.PENDING
    assigned_workers: list[Worker] = field(default_factory=list)
    per_worker_status: dict[Worker, TaskStatus] = field(default_factory=dict)
    resources: list[ResourceInstance] = field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assign_deadline: Optional[datetime] = None
    complete_deadline: Optional[datetime] = None
    retry_count: dict[str, int] = field(default_factory=dict)
    retries_exhausted: bool = False
    was_reset: bool = False
    reset_count: int = 0
    reset_incident_ref: Optional[Incident] = None
    notes: list[str] = field(default_factory=list)


@dataclass
class WorkflowInstance:
    id: str
    definition: Workflow
    current_task_instance: Optional[TaskInstance] = None
    status: WorkflowStatus = WorkflowStatus.PENDING
    execution_path: list[TraceEntry] = field(default_factory=list)
    incidents: list[Incident] = field(default_factory=list)
    task_instances: dict[str, TaskInstance] = field(default_factory=dict)
    variables: dict[str, Any] = field(default_factory=dict)
    asset: Optional["FixedAsset"] = None
