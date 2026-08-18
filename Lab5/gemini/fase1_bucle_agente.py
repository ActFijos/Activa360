"""FASE 1 — El bucle ReAct a mano, con herramientas locales.

El salto del Dia 4 al Dia 6: en tool calling nosotros decidiamos el flujo
(una llamada, una herramienta). Hoy el MODELO decide cuantos pasos dar.
Nuestro trabajo se reduce a: ejecutar lo que pide, devolverle lo que ve,
y cortar a tiempo.

Ejecutar:
    python fase1_bucle_agente.py
    python fase1_bucle_agente.py "en que estado esta el pedido PED-2026-0117"
"""
import sys

import agente
import config
import herramientas

PREGUNTA_DEFAULT = "cuantos dias tengo para devolver un producto electronico?"

if __name__ == "__main__":
    print(config.resumen(), "\n")
    pregunta = " ".join(sys.argv[1:]) or PREGUNTA_DEFAULT
    respuesta, _, traza = agente.ejecutar_agente(
        mensajes_previos=[],
        pregunta=pregunta,
        schemas=herramientas.SCHEMAS,
        ejecutar=herramientas.ejecutar,
    )
    print("\n=== RESPUESTA FINAL ===")
    print(respuesta)
    print(f"\n(tokens: {traza.tokens_entrada} entrada / {traza.tokens_salida} salida"
          f" · {len(traza.pasos)} pasos)")
