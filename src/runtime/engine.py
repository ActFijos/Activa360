from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta, timezone
import threading
from typing import Any
from src.runtime.executor import Executor, Future, ThreadedExecutor

from src.domain.models import (
    GateType,
    Incident,
    IncidentType,
    ResourceInstance,
    ResourceSpec,
    ResourceType,
    ResetScope,
    Task,
    TaskInstance,
    TaskStatus,
    TraceEntry,
    Transition,
    Workflow,
    WorkflowInstance,
    WorkflowStatus,
    Worker,
    WorkerType,
)


class WorkflowEngine:
    """Motor BPMN ligero para ejecutar workflows basados en grafos."""

    def __init__(self, workflow: Workflow, executor: Executor | None = None):
        self.workflow = workflow
        self.ready_queue: deque[TaskInstance] = deque()
        self.workers: list[Worker] = []
        self._register_default_workers()
        self.executor = executor or ThreadedExecutor()
        self._lock = threading.Lock()

    def _register_default_workers(self) -> None:
        self.workers = [
            Worker(id="w1", name="Ana", specialty=WorkerType.FINANCE),
            Worker(id="w2", name="Luis", specialty=WorkerType.LOGISTICS),
            Worker(id="w3", name="Marta", specialty=WorkerType.TECHNICAL),
        ]

    def create_instance(self, asset: Any | None = None) -> WorkflowInstance:
        self._validate_workflow()
        with self._lock:
            instance = WorkflowInstance(
                id=f"inst-{len(self.workflow.tasks)}-{abs(hash(datetime.now(timezone.utc)))}",
                definition=self.workflow,
                asset=asset,
            )
            instance.status = WorkflowStatus.IN_PROGRESS
            instance.variables["completed_tasks"] = []
            instance.variables["approval_decision"] = None
        self._enqueue_task(instance, self.workflow.start_task)
        return instance

    def _validate_workflow(self) -> None:
        if not self.workflow.start_task:
            raise ValueError("El workflow debe tener una tarea inicial")
        if not self.workflow.final_tasks:
            raise ValueError("El workflow debe tener al menos una tarea final")
        for task in self.workflow.tasks:
            for target in task.targets:
                if target not in self.workflow.tasks:
                    raise ValueError(f"La tarea {task.id} apunta a un target no definido")
        for final_task in self.workflow.final_tasks:
            if not self.workflow.dependency_matrix.has_path(self.workflow.start_task.id, final_task.id):
                raise ValueError(f"La tarea final {final_task.id} no es alcanzable")

    def _enqueue_task(self, instance: WorkflowInstance, task: Task, source_task_instance: TaskInstance | None = None) -> TaskInstance:
        with self._lock:
            task_instance = TaskInstance(id=f"{task.id}-{len(instance.execution_path)+1}", definition=task)
            task_instance.status = TaskStatus.READY
            task_instance.assign_deadline = datetime.now(timezone.utc) + timedelta(minutes=10)
            task_instance.notes.append(f"Encolada: {task.name}")
            if source_task_instance is not None:
                task_instance.resources.extend(self._propagate_resources(source_task_instance, task))
            self.ready_queue.append(task_instance)
            instance.current_task_instance = task_instance
            instance.task_instances[task.id] = task_instance
            self._append_trace(instance, task_instance, TaskStatus.READY)
            return task_instance

    def run_until_completion(self, instance: WorkflowInstance, approval_decision: str | None = None, wait_for_human_decision: bool = False) -> WorkflowInstance:
        instance.variables["approval_decision"] = approval_decision
        while True:
            with self._lock:
                if not self.ready_queue:
                    if not instance.active_futures or instance.status in {WorkflowStatus.COMPLETED, WorkflowStatus.ERROR, WorkflowStatus.CANCELLED}:
                        break
                    task_instance = None
                else:
                    task_instance = self.ready_queue.popleft()

            if task_instance is not None:
                if not self._can_execute_task(task_instance, instance):
                    with self._lock:
                        task_instance.status = TaskStatus.PENDING
                        task_instance.notes.append("Esperando gate")
                    continue
                if wait_for_human_decision and task_instance.definition.id == "task_approval" and approval_decision is None:
                    with self._lock:
                        instance.status = WorkflowStatus.IN_PROGRESS
                        instance.current_task_instance = task_instance
                        task_instance.status = TaskStatus.ASSIGNED
                        self._append_trace(instance, task_instance, TaskStatus.ASSIGNED)
                    return instance

                # Submit task execution to executor
                future = self.executor.submit(self._execute_and_process, instance, task_instance, approval_decision)
                with self._lock:
                    instance.active_futures[task_instance.definition.id] = future
            else:
                import time
                time.sleep(0.01)

        return instance

    def _execute_and_process(self, instance: WorkflowInstance, task_instance: TaskInstance, approval_decision: str | None) -> None:
        try:
            self._process_task(instance, task_instance, approval_decision)
        finally:
            with self._lock:
                instance.active_futures.pop(task_instance.definition.id, None)

    def resume_after_correction(self, instance: WorkflowInstance, approval_decision: str | None = None) -> WorkflowInstance:
        with self._lock:
            instance.status = WorkflowStatus.IN_PROGRESS
            instance.variables["approval_decision"] = approval_decision
        correction_task = next(task for task in self.workflow.tasks if task.id == "task_correction")
        self._enqueue_task(instance, correction_task)
        return self.run_until_completion(instance, approval_decision)

    def continue_after_human_decision(self, instance: WorkflowInstance, approval_decision: str | None = None) -> WorkflowInstance:
        task_instance = instance.current_task_instance
        if task_instance is None:
            return instance
        # Submit the resumed task to the executor
        future = self.executor.submit(self._execute_and_process, instance, task_instance, approval_decision)
        with self._lock:
            instance.active_futures[task_instance.definition.id] = future
        return self.run_until_completion(instance, approval_decision)

    def _can_execute_task(self, task_instance: TaskInstance, instance: WorkflowInstance) -> bool:
        gate = task_instance.definition.logic_gate
        if gate is None:
            return True
        return gate.can_start(task_instance, instance)

    def _process_task(self, instance: WorkflowInstance, task_instance: TaskInstance, approval_decision: str | None) -> None:
        task = task_instance.definition
        with self._lock:
            task_instance.status = TaskStatus.ASSIGNED
            self._assign_worker(task_instance)
            task_instance.started_at = datetime.now(timezone.utc)
            task_instance.status = TaskStatus.IN_PROGRESS
            self._append_trace(instance, task_instance, TaskStatus.IN_PROGRESS)

        if task.id == "task_register":
            self._handle_registration(task_instance, instance)
        elif task.id == "task_send_for_approval":
            self._handle_send_for_approval(task_instance, instance)
        elif task.id == "task_approval":
            self._handle_approval(task_instance, instance, approval_decision)
        elif task.id == "task_correction":
            self._handle_correction(task_instance, instance)
        elif task.id == "task_generate_hierarchy_code":
            self._handle_hierarchy_code(task_instance, instance)
        elif task.id == "task_generate_qr":
            self._handle_qr(task_instance, instance)
        elif task.id == "task_print_label":
            self._handle_label(task_instance, instance)
        elif task.id == "task_generate_acta":
            self._handle_acta(task_instance, instance)
        else:
            with self._lock:
                task_instance.status = TaskStatus.COMPLETED

        with self._lock:
            task_instance.completed_at = datetime.now(timezone.utc)
            if task.is_final:
                instance.status = WorkflowStatus.COMPLETED
                instance.current_task_instance = None
            task_instance.status = TaskStatus.COMPLETED
            completed_tasks = instance.variables.setdefault("completed_tasks", [])
            if task.id not in completed_tasks:
                completed_tasks.append(task.id)
            self._append_trace(instance, task_instance, TaskStatus.COMPLETED)

        if task.id == "task_approval" and getattr(instance.asset, "approval_status", None) == "PENDIENTE":
            with self._lock:
                instance.status = WorkflowStatus.IN_PROGRESS
                instance.current_task_instance = None
            return

        self._navigate_targets(instance, task, task_instance)

    def _assign_worker(self, task_instance: TaskInstance) -> None:
        worker = next((w for w in self.workers if w.specialty == task_instance.definition.required_worker_type), None)
        if worker is None:
            worker = self.workers[0]
        task_instance.assigned_workers.append(worker)
        task_instance.per_worker_status[worker] = TaskStatus.ASSIGNED

    def _handle_registration(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        asset.process_status = "REGISTRADO"
        asset.approval_status = "PENDIENTE"
        task_instance.resources.append(ResourceInstance(spec=ResourceSpec(key="asset", value=asset.id, type=ResourceType.TEXT, mandatory=True, propagate=True), value=asset.id))

    def _handle_send_for_approval(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        asset.process_status = "EN_APROBACION"

    def _handle_approval(self, task_instance: TaskInstance, instance: WorkflowInstance, approval_decision: str | None) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        if approval_decision == "APROBADO":
            asset.approval_status = "APROBADO"
            asset.process_status = "APROBADO"
            instance.variables["approval_decision"] = "APROBADO"
        elif approval_decision == "RECHAZADO":
            asset.approval_status = "PENDIENTE"
            asset.process_status = "EN_CORRECCION"
            instance.variables["approval_decision"] = "RECHAZADO"
            self._raise_incident(instance, task_instance.definition, task_instance.definition.backward_transitions[0] if task_instance.definition.backward_transitions else None)
        else:
            asset.approval_status = "APROBADO"
            asset.process_status = "APROBADO"
            instance.variables["approval_decision"] = "APROBADO"

    def _handle_correction(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        asset.process_status = "EN_CORRECCION"

    def _handle_hierarchy_code(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        if asset.approval_status != "APROBADO":
            raise ValueError("El activo aún no está aprobado")
        asset.codigo_jerarquico = f"{asset.categoria[:3].upper()}-{asset.id}"

    def _handle_qr(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        if asset.approval_status != "APROBADO":
            raise ValueError("El activo aún no está aprobado")
        asset.qr_data = f"{asset.id}|{asset.nombre}|{asset.responsable}"

    def _handle_label(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        asset.etiqueta_impresion = f"ETIQUETA:{asset.id}:{asset.nombre}"

    def _handle_acta(self, task_instance: TaskInstance, instance: WorkflowInstance) -> None:
        asset = instance.asset
        if asset is None:
            raise ValueError("La instancia no tiene un activo asociado")
        if not asset.codigo_jerarquico or not asset.qr_data:
            raise ValueError("El activo no tiene código jerárquico ni QR")
        asset.acta_numero = f"ACTA-{asset.id}"
        asset.fecha_ingreso = datetime.now(timezone.utc).date().isoformat()

    def _navigate_targets(self, instance: WorkflowInstance, task: Task, source_task_instance: TaskInstance) -> None:
        if task.id == "task_approval":
            if getattr(instance.asset, "approval_status", None) == "APROBADO":
                target_task = next(t for t in self.workflow.tasks if t.id == "task_generate_hierarchy_code")
                self._enqueue_task(instance, target_task, source_task_instance)
                return
            if getattr(instance.asset, "approval_status", None) == "PENDIENTE":
                instance.status = WorkflowStatus.IN_PROGRESS
                instance.current_task_instance = None
                return
        for target in task.targets:
            self._enqueue_task(instance, target, source_task_instance)

    def _propagate_resources(self, source_task_instance: TaskInstance, target_task: Task) -> list[ResourceInstance]:
        propagated: list[ResourceInstance] = []
        required_keys = {(res.key, res.type) for res in target_task.required_resources}
        for resource in source_task_instance.resources:
            if resource.spec.propagate and (resource.spec.key, resource.spec.type) in required_keys:
                propagated.append(ResourceInstance(spec=ResourceSpec(key=resource.spec.key, value=resource.value, type=resource.spec.type, mandatory=False, propagate=False), value=resource.value))
        return propagated

    def _append_trace(self, instance: WorkflowInstance, task_instance: TaskInstance, status: TaskStatus | WorkflowStatus) -> None:
        instance.execution_path.append(
            TraceEntry(
                task_id=task_instance.definition.id,
                status=status.value,
                timestamp=datetime.now(timezone.utc),
                iteration=1,
            )
        )

    def _raise_incident(self, instance: WorkflowInstance, from_task: Task, transition: Transition | None) -> None:
        if transition is None:
            return
        with self._lock:
            incident = Incident(
                id=f"inc-{len(instance.incidents)+1}",
                from_task=from_task,
                to_task=transition.target,
                type=IncidentType.QUALITY,
                reason="Rechazo por el jefe",
                raised_by=self.workers[0],
                timestamp=datetime.now(timezone.utc),
                iteration=1,
                reset_scope=ResetScope.ALL_DOWNSTREAM,
            )
            instance.incidents.append(incident)
            self._apply_reset(instance, incident)
            if transition.max_retries is not None:
                task_instance = instance.task_instances.get(from_task.id)
                if task_instance is not None:
                    key = f"{from_task.id}->{transition.target.id}" if transition.target is not None else from_task.id
                    task_instance.retry_count[key] = task_instance.retry_count.get(key, 0) + 1
                    if task_instance.retry_count[key] > transition.max_retries:
                        task_instance.retries_exhausted = True
                        instance.status = transition.exhausted_status

    def _apply_reset(self, instance: WorkflowInstance, incident: Incident) -> None:
        if incident.to_task is None:
            return
        reachable: set[Task] = set()
        self._collect_reachable_tasks(incident.to_task, reachable)
        for task in reachable:
            task_instance = instance.task_instances.get(task.id)
            if task_instance is None:
                continue

            if task.id in instance.active_futures:
                instance.active_futures[task.id].cancel()
                instance.active_futures.pop(task.id, None)

            task_instance.status = TaskStatus.PENDING
            task_instance.was_reset = True
            task_instance.reset_count += 1
            task_instance.reset_incident_ref = incident
            task_instance.notes.append("Reset por incidente")

    def _collect_reachable_tasks(self, task: Task, reachable: set[Task]) -> None:
        if task in reachable:
            return
        reachable.add(task)
        for target in task.targets:
            self._collect_reachable_tasks(target, reachable)
