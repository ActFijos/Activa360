"""El bucle del agente (ReAct) — el corazon del Dia 6.

    Pensamiento -> Accion -> Observacion -> ... -> Respuesta final

En codigo es un `while` con tres reglas:
  1. Si el modelo pide herramientas, se ejecutan y se le devuelve el resultado.
  2. Si el modelo responde texto, ese texto es la respuesta final: se corta.
  3. Si se llega a MAX_PASOS, se corta igual — un agente sin tope de pasos
     es un bug con presupuesto ilimitado.

El bucle NO sabe que herramientas existen: recibe los schemas y un callback
`ejecutar`. Por eso el mismo bucle sirve con herramientas locales (fase 1-2)
o descubiertas via MCP (fase 5).
"""
import json
from dataclasses import dataclass, field
from typing import Callable, List

import config

INSTRUCCIONES = (
    "Eres SoporteIA, el asistente de soporte de una tienda online. "
    "Responde SOLO con informacion verificada con tus herramientas: "
    "las reglas de negocio salen de buscar_documentacion (cita la fuente) "
    "y los datos de pedidos salen de buscar_pedido. "
    "Antes de una accion de escritura (cancelar_pedido, crear_ticket) "
    "muestra el plan y pide confirmacion; solo usa confirmado=true si el "
    "usuario ya dijo que si. Si no puedes resolver, ofrece crear un ticket. "
    "Responde en espanol, breve y concreto."
)


@dataclass
class Traza:
    """Registro de cada paso: la observabilidad minima de un agente."""
    pasos: List[dict] = field(default_factory=list)
    tokens_entrada: int = 0
    tokens_salida: int = 0

    def registrar(self, tipo: str, detalle: str) -> None:
        paso = {"n": len(self.pasos) + 1, "tipo": tipo, "detalle": detalle}
        self.pasos.append(paso)
        print(f"  [{paso['n']:02d}] {tipo:12s} {detalle[:110]}")


def ejecutar_agente(
    mensajes_previos: List[dict],
    pregunta: str,
    schemas: List[dict],
    ejecutar: Callable[[str, dict], dict],
    max_pasos: int = None,
) -> tuple:
    """Corre el bucle ReAct y devuelve (respuesta_final, mensajes, traza)."""
    cliente = config.crear_cliente()
    max_pasos = max_pasos or config.MAX_PASOS
    traza = Traza()

    mensajes = list(mensajes_previos) or [{"role": "system", "content": INSTRUCCIONES}]
    mensajes.append({"role": "user", "content": pregunta})
    traza.registrar("pregunta", pregunta)

    for _ in range(max_pasos):
        r = cliente.chat.completions.create(
            model=config.MODEL,
            messages=mensajes,
            tools=schemas,
            temperature=0,
        )
        if r.usage:
            traza.tokens_entrada += r.usage.prompt_tokens
            traza.tokens_salida += r.usage.completion_tokens
        msg = r.choices[0].message

        # Regla 2: texto => respuesta final
        if not msg.tool_calls:
            traza.registrar("respuesta", msg.content or "(vacia)")
            mensajes.append({"role": "assistant", "content": msg.content})
            return msg.content, mensajes, traza

        # Regla 1: el modelo pidio herramientas (Accion -> Observacion)
        mensajes.append(msg.model_dump(exclude_none=True))
        for tc in msg.tool_calls:
            argumentos = json.loads(tc.function.arguments or "{}")
            traza.registrar("accion", f"{tc.function.name}({tc.function.arguments})")
            resultado = ejecutar(tc.function.name, argumentos)
            traza.registrar("observacion", json.dumps(resultado, ensure_ascii=False))
            mensajes.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(resultado, ensure_ascii=False),
                }
            )

    # Regla 3: tope de pasos
    aviso = f"Alcance el limite de {max_pasos} pasos sin respuesta final."
    traza.registrar("corte", aviso)
    return aviso, mensajes, traza
