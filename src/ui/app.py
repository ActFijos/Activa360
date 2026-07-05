from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk
from typing import Any

from src.ui.controllers import WorkflowUIController


class MainApplication:
    """Aplicación de escritorio de la interfaz BPMN para activos fijos."""

    def __init__(self, controller: WorkflowUIController | None = None) -> None:
        self.root = tk.Tk()
        self.root.title("Motor BPMN · Registro de Activos Fijos")
        self.root.geometry("1480x900")
        self.root.minsize(1200, 700)
        self.controller = controller or WorkflowUIController()
        self._selected_instance_id: str | None = None
        self._build_styles()
        self._build_layout()
        self._build_dashboard_screen()
        self._build_registration_screen()
        self._build_worklist_screen()
        self._build_approval_screen()
        self._build_detail_screen()
        self._build_artifacts_screen()
        self.show_screen("dashboard")
        self.refresh_all()

    def _build_styles(self) -> None:
        style = ttk.Style(self.root)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("Sidebar.TButton", padding=(12, 8), font=("Segoe UI", 10, "bold"))
        style.configure("Action.TButton", padding=(10, 6), font=("Segoe UI", 10))
        style.configure("Title.TLabel", font=("Segoe UI", 14, "bold"))
        style.configure("Subtitle.TLabel", font=("Segoe UI", 10))

    def _build_layout(self) -> None:
        self.root.columnconfigure(1, weight=1)
        self.root.rowconfigure(0, weight=1)

        sidebar = ttk.Frame(self.root, padding=(12, 16))
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.columnconfigure(0, weight=1)
        ttk.Label(sidebar, text="BPMN UI", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 16))
        ttk.Label(sidebar, text="Operación del workflow", style="Subtitle.TLabel").grid(row=1, column=0, sticky="w", pady=(0, 18))

        self.nav_buttons: dict[str, ttk.Button] = {}
        for idx, name in enumerate([("dashboard", "Dashboard"), ("registration", "Registro"), ("worklist", "Bandeja"), ("approval", "Aprobación"), ("detail", "Detalle"), ("artifacts", "Artefactos")], start=2):
            btn = ttk.Button(sidebar, text=name[1], style="Sidebar.TButton", command=lambda key=name[0]: self.show_screen(key))
            btn.grid(row=idx, column=0, sticky="ew", pady=4)
            self.nav_buttons[name[0]] = btn

        self.content = ttk.Frame(self.root, padding=(18, 16))
        self.content.grid(row=0, column=1, sticky="nsew")
        self.content.columnconfigure(0, weight=1)
        self.content.rowconfigure(0, weight=1)

        self.screens: dict[str, ttk.Frame] = {}

    def _build_dashboard_screen(self) -> None:
        frame = ttk.Frame(self.content)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        self.screens["dashboard"] = frame

        ttk.Label(frame, text="Dashboard · Workflow de activos fijos", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 16))
        summary_frame = ttk.LabelFrame(frame, text="Resumen ejecutivo")
        summary_frame.grid(row=1, column=0, sticky="ew", pady=(0, 12))
        summary_frame.columnconfigure(0, weight=1)
        summary_frame.columnconfigure(1, weight=1)
        summary_frame.columnconfigure(2, weight=1)
        summary_frame.columnconfigure(3, weight=1)

        self.dashboard_metrics: dict[str, ttk.Label] = {}
        for index, label in enumerate([("Activos activos", "active_instances"), ("Pendientes de aprobación", "pending_approval"), ("Aprobados", "approved"), ("Actas generadas", "generated_actas")]):
            inner = ttk.Frame(summary_frame, padding=8)
            inner.grid(row=0, column=index, sticky="nsew", padx=4)
            ttk.Label(inner, text=label[0], style="Subtitle.TLabel").pack(anchor="w")
            value = ttk.Label(inner, text="0", font=("Segoe UI", 16, "bold"))
            value.pack(anchor="w")
            self.dashboard_metrics[label[1]] = value

        list_frame = ttk.LabelFrame(frame, text="Instancias abiertas")
        list_frame.grid(row=2, column=0, sticky="nsew")
        list_frame.columnconfigure(0, weight=1)
        list_frame.rowconfigure(0, weight=1)
        self.dashboard_table = ttk.Treeview(list_frame, columns=("id", "activo", "estado", "tarea"), show="headings")
        self.dashboard_table.heading("id", text="ID")
        self.dashboard_table.heading("activo", text="Activo")
        self.dashboard_table.heading("estado", text="Estado")
        self.dashboard_table.heading("tarea", text="Tarea actual")
        self.dashboard_table.column("id", width=160)
        self.dashboard_table.column("activo", width=220)
        self.dashboard_table.column("estado", width=140)
        self.dashboard_table.column("tarea", width=260)
        self.dashboard_table.grid(row=0, column=0, sticky="nsew")

    def _build_registration_screen(self) -> None:
        frame = ttk.Frame(self.content)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        self.screens["registration"] = frame

        ttk.Label(frame, text="Registro de activo fijo", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 12))
        body = ttk.Frame(frame)
        body.grid(row=1, column=0, sticky="nsew")
        body.columnconfigure(0, weight=1)
        body.columnconfigure(1, weight=1)

        self.form_fields: dict[str, tk.StringVar] = {}
        left_fields = [
            ("asset_id", "ID del activo"),
            ("nombre", "Nombre"),
            ("categoria", "Categoría"),
            ("subcategoria", "Subcategoría"),
            ("descripcion", "Descripción"),
            ("marca", "Marca"),
            ("modelo", "Modelo"),
        ]
        right_fields = [
            ("numero_serie", "Número de serie"),
            ("estado", "Estado"),
            ("fecha_compra", "Fecha de compra"),
            ("costo", "Costo"),
            ("proveedor", "Proveedor"),
            ("ubicacion", "Ubicación"),
            ("responsable", "Responsable"),
        ]
        for index, (key, label) in enumerate(left_fields):
            row = index // 1
            col = index % 1
            var = tk.StringVar()
            self.form_fields[key] = var
            ttk.Label(body, text=label).grid(row=index, column=0, sticky="w", padx=(0, 8), pady=4)
            ttk.Entry(body, textvariable=var).grid(row=index, column=1, sticky="ew", pady=4)
        for index, (key, label) in enumerate(right_fields):
            row = index // 1
            col = index % 1
            var = tk.StringVar()
            self.form_fields[key] = var
            ttk.Label(body, text=label).grid(row=index, column=2, sticky="w", padx=(12, 8), pady=4)
            ttk.Entry(body, textvariable=var).grid(row=index, column=3, sticky="ew", pady=4)

        obs_var = tk.StringVar()
        self.form_fields["observaciones"] = obs_var
        ttk.Label(body, text="Observaciones").grid(row=7, column=0, sticky="w", pady=(12, 4))
        ttk.Entry(body, textvariable=obs_var).grid(row=7, column=1, columnspan=3, sticky="ew", pady=(12, 4))

        actions = ttk.Frame(frame)
        actions.grid(row=2, column=0, sticky="ew", pady=(16, 0))
        ttk.Button(actions, text="Guardar y enviar a aprobación", style="Action.TButton", command=self.on_register_asset).pack(side="left")

    def _build_worklist_screen(self) -> None:
        frame = ttk.Frame(self.content)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        self.screens["worklist"] = frame

        ttk.Label(frame, text="Bandeja de tareas", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 12))
        self.worklist_table = ttk.Treeview(frame, columns=("instance", "task", "status", "assignee", "action"), show="headings")
        self.worklist_table.heading("instance", text="Instancia")
        self.worklist_table.heading("task", text="Tarea")
        self.worklist_table.heading("status", text="Estado")
        self.worklist_table.heading("assignee", text="Responsable")
        self.worklist_table.heading("action", text="Acción")
        self.worklist_table.grid(row=1, column=0, sticky="nsew")

    def _build_approval_screen(self) -> None:
        frame = ttk.Frame(self.content)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        self.screens["approval"] = frame

        ttk.Label(frame, text="Aprobación del jefe", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 12))
        self.approval_instance_var = tk.StringVar()
        ttk.Label(frame, text="Instancia seleccionada").grid(row=1, column=0, sticky="w")
        ttk.Entry(frame, textvariable=self.approval_instance_var).grid(row=2, column=0, sticky="ew", pady=(0, 8))
        self.approval_text = tk.Text(frame, height=10)
        self.approval_text.grid(row=3, column=0, sticky="nsew")
        actions = ttk.Frame(frame)
        actions.grid(row=4, column=0, sticky="ew", pady=(10, 0))
        ttk.Button(actions, text="Aprobar", style="Action.TButton", command=self.on_approve).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Rechazar", style="Action.TButton", command=self.on_reject).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Reanudar corrección", style="Action.TButton", command=self.on_resume_correction).pack(side="left")

    def _build_detail_screen(self) -> None:
        frame = ttk.Frame(self.content)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)
        self.screens["detail"] = frame

        ttk.Label(frame, text="Detalle del proceso BPMN", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 12))
        self.detail_tree = ttk.Treeview(frame, columns=("task", "status", "iteration"), show="headings")
        self.detail_tree.heading("task", text="Tarea")
        self.detail_tree.heading("status", text="Estado")
        self.detail_tree.heading("iteration", text="Iteración")
        self.detail_tree.grid(row=1, column=0, sticky="nsew")

    def _build_artifacts_screen(self) -> None:
        frame = ttk.Frame(self.content)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.columnconfigure(0, weight=1)
        self.screens["artifacts"] = frame

        ttk.Label(frame, text="Artefactos generados", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 12))
        self.artifacts_text = tk.Text(frame, height=16)
        self.artifacts_text.grid(row=1, column=0, sticky="nsew")

    def show_screen(self, name: str) -> None:
        for frame in self.screens.values():
            frame.grid_remove()
        self.screens[name].grid()

    def refresh_all(self) -> None:
        summary = self.controller.dashboard_summary()
        self.dashboard_metrics["active_instances"].config(text=str(summary.active_instances))
        self.dashboard_metrics["pending_approval"].config(text=str(summary.pending_approval))
        self.dashboard_metrics["approved"].config(text=str(summary.approved))
        self.dashboard_metrics["generated_actas"].config(text=str(summary.generated_actas))

        self.dashboard_table.delete(*self.dashboard_table.get_children())
        for instance in self.controller.instances():
            asset = instance.asset
            self.dashboard_table.insert("", "end", values=(instance.id, asset.nombre if asset else "-", instance.status.value, instance.current_task_instance.definition.name if instance.current_task_instance else "-"))

        self.worklist_table.delete(*self.worklist_table.get_children())
        for task in self.controller.pending_tasks():
            self.worklist_table.insert("", "end", values=(task.instance_id, task.task_name, task.task_status, task.assignee, task.available_action))

        if self._selected_instance_id is None and self.controller.instances():
            self._selected_instance_id = self.controller.instances()[0].id
        if self._selected_instance_id is not None:
            self.approval_instance_var.set(self._selected_instance_id)
            self._render_detail(self._selected_instance_id)
            self._render_artifacts(self._selected_instance_id)

    def _render_detail(self, instance_id: str) -> None:
        detail = self.controller.process_detail(instance_id)
        self.detail_tree.delete(*self.detail_tree.get_children())
        for entry in detail.execution_path:
            self.detail_tree.insert("", "end", values=(entry["task_id"], entry["status"], entry["iteration"]))

    def _render_artifacts(self, instance_id: str) -> None:
        snapshot = self.controller.artifact_snapshot(instance_id)
        self.artifacts_text.delete("1.0", tk.END)
        content = f"Código jerárquico: {snapshot.hierarchy_code or '-'}\nQR: {snapshot.qr_data or '-'}\nEtiqueta: {snapshot.label_text or '-'}\nActa: {snapshot.acta_number or '-'}\nEstado: {snapshot.status}"
        self.artifacts_text.insert("1.0", content)

    def on_register_asset(self) -> None:
        values = {key: var.get().strip() for key, var in self.form_fields.items()}
        if not values.get("asset_id") or not values.get("nombre") or not values.get("responsable"):
            messagebox.showerror("Validación", "Debe completar al menos ID, nombre y responsable.")
            return
        instance = self.controller.register_asset(values)
        self._selected_instance_id = instance.id
        self.refresh_all()
        self.show_screen("approval")
        messagebox.showinfo("Proceso iniciado", f"Instancia creada: {instance.id}")

    def on_approve(self) -> None:
        if self._selected_instance_id is None:
            messagebox.showwarning("Sin selección", "Seleccione una instancia primero.")
            return
        instance = self.controller.instances()[0] if self.controller.instances() else None
        if instance is None:
            return
        self.controller.approve_asset(instance, observations=self.approval_text.get("1.0", tk.END).strip())
        self.refresh_all()
        messagebox.showinfo("Aprobación", "El activo fue aprobado y el workflow avanzó.")

    def on_reject(self) -> None:
        if self._selected_instance_id is None:
            messagebox.showwarning("Sin selección", "Seleccione una instancia primero.")
            return
        instance = self.controller.instances()[0] if self.controller.instances() else None
        if instance is None:
            return
        self.controller.reject_asset(instance, observations=self.approval_text.get("1.0", tk.END).strip())
        self.refresh_all()
        messagebox.showinfo("Rechazo", "El proceso fue devuelto a corrección.")

    def on_resume_correction(self) -> None:
        if self._selected_instance_id is None:
            messagebox.showwarning("Sin selección", "Seleccione una instancia primero.")
            return
        instance = self.controller.instances()[0] if self.controller.instances() else None
        if instance is None:
            return
        self.controller.resume_correction(instance)
        self.refresh_all()
        messagebox.showinfo("Corrección", "Se reanudó la aprobación después de la corrección.")

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    application = MainApplication()
    application.run()


if __name__ == "__main__":
    main()
