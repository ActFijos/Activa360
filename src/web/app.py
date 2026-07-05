from __future__ import annotations

from flask import Flask, render_template_string, request

from src.ui.controllers import WorkflowUIController


def create_app(controller: WorkflowUIController | None = None) -> Flask:
    app = Flask(__name__, template_folder="templates")
    app.controller = controller or WorkflowUIController()

    HTML = """
    <!doctype html>
    <html>
      <head>
        <meta charset=\"utf-8\">
        <title>Motor BPMN · Activos Fijos</title>
        <style>
          :root {
            --bg: #f5f7fb;
            --panel: #ffffff;
            --border: #e4eaf2;
            --text: #10263f;
            --muted: #6b7a8f;
            --primary: #4f7cff;
            --primary-soft: #eef4ff;
            --success: #4bbf8a;
            --warning: #f5b95d;
            --danger: #dc6b7b;
            --shadow: 0 16px 38px rgba(16, 38, 63, 0.08);
          }
          body { font-family: Inter, Segoe UI, Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #f8fbff 0%, var(--bg) 100%); color: var(--text); }
          nav { background: linear-gradient(120deg, #183b5c 0%, #2f5e8a 100%); color: white; padding: 16px 24px; display: flex; gap: 16px; align-items: center; }
          nav a { color: white; text-decoration: none; font-weight: 600; padding: 8px 10px; border-radius: 999px; }
          nav a:hover { background: rgba(255,255,255,0.14); }
          .container { max-width: 1280px; margin: 24px auto; background: var(--panel); padding: 24px; border-radius: 20px; box-shadow: var(--shadow); }
          .hero { background: linear-gradient(120deg, #eef6ff 0%, #f7f8ff 100%); border: 1px solid var(--border); padding: 20px; border-radius: 16px; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
          .card { background: var(--panel); padding: 16px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 8px 24px rgba(16, 38, 63, 0.04); }
          .card h3 { margin: 0 0 6px; font-size: 1.3rem; }
          .muted { color: var(--muted); }
          .section { background: #fcfdff; border: 1px solid var(--border); border-radius: 16px; padding: 18px; margin-bottom: 16px; }
          .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          label { display: block; margin-top: 10px; font-weight: 600; color: #274562; }
          input, textarea, select, button { width: 100%; padding: 10px 12px; margin-top: 6px; border-radius: 10px; border: 1px solid #cad7e4; box-sizing: border-box; font-size: 0.95rem; }
          input:focus, textarea:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,124,255,0.16); }
          button { background: linear-gradient(120deg, var(--primary) 0%, #5f8fff 100%); color: white; border: none; cursor: pointer; font-weight: 700; }
          button.secondary { background: linear-gradient(120deg, #8fb1a7 0%, #7ebf9a 100%); }
          .error { color: var(--danger); font-size: 0.9rem; margin-top: 4px; }
          .success { color: var(--success); font-size: 0.95rem; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border-bottom: 1px solid var(--border); padding: 10px 8px; text-align: left; }
          th { color: var(--muted); font-weight: 700; }
          .pill { display: inline-block; padding: 5px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 0.85rem; font-weight: 600; }
          .badge-approved { background: #eaf9f1; color: #248d58; }
          .badge-pending { background: #fff6e8; color: #b77a00; }
          .badge-rejected { background: #fdecee; color: #b53b57; }
        </style>
      </head>
      <body>
        <nav>
          <a href=\"/\">Dashboard</a>
          <a href=\"/register\">Registro</a>
          <a href=\"/tasks\">Bandeja</a>
          <a href=\"/trace\">Trazabilidad</a>
          <a href=\"/artifacts\">Artefactos</a>
        </nav>
        <div class=\"container\">
          {{ content | safe }}
        </div>
      </body>
    </html>
    """

    @app.get("/")
    def dashboard():
        summary = app.controller.dashboard_summary()
        instances = app.controller.instances()
        rows = []
        for instance in instances:
            asset = instance.asset
            rows.append((instance.id, asset.nombre if asset else "-", instance.status.value, instance.current_task_instance.definition.name if instance.current_task_instance else "-"))
        content = f"""
        <div class=\"hero\">
          <h2 style=\"margin-top:0\">Dashboard · Registro de activos fijos</h2>
          <p class=\"muted\">Panel claro para operar, revisar y dar seguimiento al flujo BPMN del proceso institucional.</p>
        </div>
        <div class=\"grid\">
          <div class=\"card\"><h3>{summary.active_instances}</h3><div class=\"muted\">Activos activos</div></div>
          <div class=\"card\"><h3>{summary.pending_approval}</h3><div class=\"muted\">Pendientes de aprobación</div></div>
          <div class=\"card\"><h3>{summary.approved}</h3><div class=\"muted\">Aprobados</div></div>
          <div class=\"card\"><h3>{summary.generated_actas}</h3><div class=\"muted\">Actas generadas</div></div>
        </div>
        <div class=\"section\">
          <h3 style=\"margin-top:0\">Instancias abiertas</h3>
          <table><tr><th>ID</th><th>Activo</th><th>Estado</th><th>Tarea actual</th></tr>
          {rows}
          </table>
        </div>
        """
        rows_html = "".join(f"<tr><td>{rid}</td><td>{name}</td><td>{state}</td><td>{task}</td></tr>" for rid, name, state, task in rows)
        return render_template_string(HTML, content=content.replace("{rows}", rows_html))

    @app.get("/register")
    def register_view():
        content = """
        <div class=\"hero\">
          <h2 style=\"margin-top:0\">Registro de activo fijo</h2>
          <p class=\"muted\">Complete los datos del activo con validación guiada. El flujo BPMN lo llevará a aprobación y generación de artefactos.</p>
        </div>
        <form method=\"post\" action=\"/register\">
          <div class=\"section\">
            <h3 style=\"margin-top:0\">Información general</h3>
            <div class=\"row\">
              <div><label>ID del activo</label><input name=\"asset_id\" required placeholder=\"Ej. FA-001\"></div>
              <div><label>Nombre</label><input name=\"nombre\" required placeholder=\"Nombre del activo\"></div>
            </div>
            <div class=\"row\">
              <div><label>Categoría</label><input name=\"categoria\" placeholder=\"Tecnología\"></div>
              <div><label>Subcategoría</label><input name=\"subcategoria\" placeholder=\"Hardware\"></div>
            </div>
            <label>Descripción</label><textarea name=\"descripcion\" rows=\"3\" placeholder=\"Describa el bien y su uso principal\"></textarea>
          </div>
          <div class=\"section\">
            <h3 style=\"margin-top:0\">Datos técnicos</h3>
            <div class=\"row\">
              <div><label>Marca</label><input name=\"marca\" placeholder=\"Marca\"></div>
              <div><label>Modelo</label><input name=\"modelo\" placeholder=\"Modelo\"></div>
            </div>
            <div class=\"row\">
              <div><label>Número de serie</label><input name=\"numero_serie\" placeholder=\"Serie\"></div>
              <div><label>Estado físico</label><input name=\"estado\" value=\"NUEVO\"></div>
            </div>
          </div>
          <div class=\"section\">
            <h3 style=\"margin-top:0\">Información económica</h3>
            <div class=\"row\">
              <div><label>Fecha de compra</label><input type=\"date\" name=\"fecha_compra\"></div>
              <div><label>Costo</label><input type=\"number\" name=\"costo\" value=\"0\"></div>
            </div>
            <label>Proveedor</label><input name=\"proveedor\" placeholder=\"Proveedor\">
          </div>
          <div class=\"section\">
            <h3 style=\"margin-top:0\">Ubicación y responsable</h3>
            <div class=\"row\">
              <div><label>Ubicación</label><input name=\"ubicacion\" placeholder=\"Laboratorio / Oficina\"></div>
              <div><label>Responsable</label><input name=\"responsable\" required placeholder=\"Encargado del activo\"></div>
            </div>
            <label>Observaciones</label><textarea name=\"observaciones\" rows=\"3\" placeholder=\"Observaciones de control o seguimiento\"></textarea>
          </div>
          <div class=\"section\">
            <div class=\"row\">
              <div><button type=\"submit\">Guardar y enviar a aprobación</button></div>
              <div><button type=\"button\" class=\"secondary\" onclick=\"window.location.href='/'\">Cancelar</button></div>
            </div>
          </div>
        </form>
        """
        return render_template_string(HTML, content=content)

    @app.post("/register")
    def register_submit():
        data = request.form.to_dict()
        errors = []
        if not data.get("asset_id", "").strip():
            errors.append("El identificador del activo es obligatorio.")
        if not data.get("nombre", "").strip():
            errors.append("El nombre del activo es obligatorio.")
        if not data.get("responsable", "").strip():
            errors.append("Debe indicar un responsable.")
        if data.get("costo", "") and not str(data.get("costo", "")).replace('.', '', 1).isdigit():
            errors.append("El costo debe ser numérico.")
        if errors:
            return render_template_string(HTML, content=f"<div class=\"section\"><h2>El formulario contiene errores</h2>{''.join(f'<div class=\"error\">• {e}</div>' for e in errors)}</div>"), 400
        instance = app.controller.register_asset(data)
        return render_template_string(HTML, content=f"<div class=\"section\"><h2>Activo registrado correctamente</h2><p class=\"success\">Instancia creada: {instance.id}</p><p>El proceso quedó en estado de aprobación y aparece en el dashboard y la bandeja.</p></div>")

    @app.get("/tasks")
    def tasks_view():
        items = app.controller.pending_tasks()
        rows = "".join(f"<tr><td>{item.instance_id}</td><td>{item.task_name}</td><td>{item.task_status}</td><td>{item.assignee}</td><td>{item.available_action}</td></tr>" for item in items)
        content = f"""
        <h2>Bandeja de tareas</h2>
        <table><tr><th>Instancia</th><th>Tarea</th><th>Estado</th><th>Responsable</th><th>Acción</th></tr>{rows}</table>
        """
        return render_template_string(HTML, content=content)

    @app.get("/trace")
    def trace_view():
        instances = app.controller.instances()
        detail = ""
        for instance in instances:
            detail += f"<h3>{instance.id}</h3><p>Estado: {instance.status.value}</p><ul>"
            for entry in instance.execution_path:
                detail += f"<li>{entry.task_id} -> {entry.status}</li>"
            detail += "</ul>"
        content = f"<h2>Trazabilidad del proceso</h2>{detail}"
        return render_template_string(HTML, content=content)

    @app.get("/artifacts")
    def artifacts_view():
        instances = app.controller.instances()
        items = []
        for instance in instances:
            snapshot = app.controller.artifact_snapshot(instance.id)
            items.append((instance.id, snapshot.hierarchy_code or "-", snapshot.qr_data or "-", snapshot.acta_number or "-"))
        rows = "".join(f"<tr><td>{iid}</td><td>{hc}</td><td>{qr}</td><td>{acta}</td></tr>" for iid, hc, qr, acta in items)
        content = f"""
        <h2>Artefactos generados</h2>
        <table><tr><th>Instancia</th><th>Código jerárquico</th><th>QR</th><th>Acta</th></tr>{rows}</table>
        """
        return render_template_string(HTML, content=content)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000, use_reloader=False)
