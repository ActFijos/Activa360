"""Las herramientas reales de SoporteIA — el "cuerpo" del agente.

Tres lecturas y una escritura:

    buscar_documentacion  (read)  -> RAG sobre la base de conocimiento (Dia 5)
    buscar_pedido         (read)  -> el sistema de pedidos (Dia 4)
    crear_ticket          (WRITE) -> abre un ticket de soporte
    cancelar_pedido       (WRITE) -> cambia datos reales => requiere confirmacion

REGLA DEL DIA: una herramienta de escritura NUNCA se ejecuta sin
`confirmado=True`. El agente primero muestra que va a hacer y espera el
"si" del usuario. (La politica de cancelaciones.md dice exactamente eso.)

Estas mismas funciones se exponen despues por el servidor MCP: la logica
vive UNA sola vez, el transporte es lo que cambia.
"""
import json
import uuid
from datetime import date

import config
import rag

# ---------------------------------------------------------------------------
# Implementaciones
# ---------------------------------------------------------------------------

def buscar_documentacion(pregunta: str, k: int = None) -> dict:
    """RAG: devuelve fragmentos con fuente. El agente redacta con esto."""
    fragmentos = rag.consultar(pregunta, k=k)
    return {"pregunta": pregunta, "fragmentos": fragmentos}


def _leer_pedidos() -> dict:
    with open(config.DATOS / "pedidos.json", encoding="utf-8") as f:
        return json.load(f)


def _guardar_pedidos(pedidos: dict) -> None:
    with open(config.DATOS / "pedidos.json", "w", encoding="utf-8") as f:
        json.dump(pedidos, f, ensure_ascii=False, indent=2)


def buscar_pedido(numero_pedido: str) -> dict:
    """Dato vivo del sistema: estado, fechas, monto."""
    pedidos = _leer_pedidos()
    pedido = pedidos.get(numero_pedido.strip().upper())
    if pedido is None:
        return {"error": f"No existe el pedido {numero_pedido}"}
    return {"numero_pedido": numero_pedido.upper(), **pedido}


def cancelar_pedido(numero_pedido: str, motivo: str, confirmado: bool = False) -> dict:
    """ESCRITURA. Sin confirmado=True no toca nada: devuelve el plan."""
    pedidos = _leer_pedidos()
    numero = numero_pedido.strip().upper()
    pedido = pedidos.get(numero)
    if pedido is None:
        return {"error": f"No existe el pedido {numero}"}
    if pedido["estado"] not in ("RECIBIDO", "EN PREPARACION"):
        return {
            "error": (
                f"El pedido {numero} esta {pedido['estado']}: la politica solo "
                "permite cancelar en RECIBIDO o EN PREPARACION."
            )
        }
    if not confirmado:
        return {
            "requiere_confirmacion": True,
            "accion": f"Cancelar {numero} ({pedido['producto']}, {pedido['monto']} Bs)",
            "detalle": "Reembolso total en 5 dias habiles. Responde 'si' para confirmar.",
        }
    pedido["estado"] = "CANCELADO"
    pedido["motivo_cancelacion"] = motivo
    pedido["fecha_cancelacion"] = str(date.today())
    _guardar_pedidos(pedidos)
    return {"ok": True, "numero_pedido": numero, "nuevo_estado": "CANCELADO",
            "auditoria": f"{date.today()} · {numero} · {motivo}"}


def crear_ticket(numero_pedido: str, asunto: str, confirmado: bool = False) -> dict:
    """ESCRITURA. Abre un ticket para un humano — el 'escalar' de SoporteIA."""
    if not confirmado:
        return {
            "requiere_confirmacion": True,
            "accion": f"Crear ticket para {numero_pedido}: {asunto}",
            "detalle": "Responde 'si' para confirmar.",
        }
    ticket_id = f"TCK-{uuid.uuid4().hex[:6].upper()}"
    ruta = config.DATOS / "tickets.json"
    tickets = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else []
    tickets.append({"id": ticket_id, "pedido": numero_pedido, "asunto": asunto,
                    "fecha": str(date.today()), "estado": "ABIERTO"})
    ruta.write_text(json.dumps(tickets, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "ticket": ticket_id}


# ---------------------------------------------------------------------------
# Registro: nombre -> (funcion, schema JSON para tool calling)
# El mismo diccionario alimenta (a) el bucle local y (b) el servidor MCP.
# ---------------------------------------------------------------------------

REGISTRO = {
    "buscar_documentacion": buscar_documentacion,
    "buscar_pedido": buscar_pedido,
    "cancelar_pedido": cancelar_pedido,
    "crear_ticket": crear_ticket,
}

SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "buscar_documentacion",
            "description": (
                "Busca en las politicas y documentacion de SoporteIA "
                "(devoluciones, envios, cancelaciones, garantia, atencion). "
                "Usar SIEMPRE antes de afirmar una regla de negocio."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "pregunta": {"type": "string", "description": "Que se necesita saber"},
                },
                "required": ["pregunta"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_pedido",
            "description": "Consulta el estado actual de un pedido (dato vivo del sistema).",
            "parameters": {
                "type": "object",
                "properties": {
                    "numero_pedido": {"type": "string", "description": "Ej: PED-2026-0117"},
                },
                "required": ["numero_pedido"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancelar_pedido",
            "description": (
                "Cancela un pedido. ESCRITURA: llamar primero con confirmado=false "
                "para mostrar el plan; solo pasar confirmado=true si el usuario dijo que si."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "numero_pedido": {"type": "string"},
                    "motivo": {"type": "string"},
                    "confirmado": {"type": "boolean", "default": False},
                },
                "required": ["numero_pedido", "motivo"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "crear_ticket",
            "description": (
                "Abre un ticket de soporte para que lo atienda un humano. ESCRITURA: "
                "requiere confirmado=true tras el 'si' del usuario."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "numero_pedido": {"type": "string"},
                    "asunto": {"type": "string"},
                    "confirmado": {"type": "boolean", "default": False},
                },
                "required": ["numero_pedido", "asunto"],
            },
        },
    },
]


def ejecutar(nombre: str, argumentos: dict) -> dict:
    """Despachador unico: valida que la herramienta exista y la llama."""
    funcion = REGISTRO.get(nombre)
    if funcion is None:
        return {"error": f"Herramienta desconocida: {nombre}"}
    try:
        return funcion(**argumentos)
    except TypeError as e:
        return {"error": f"Argumentos invalidos para {nombre}: {e}"}
