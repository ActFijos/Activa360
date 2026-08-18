"""FASE 5 — El agente completo: bucle ReAct + herramientas via MCP.

Fijate lo que NO cambio: agente.py es EXACTAMENTE el mismo de la fase 1.
El bucle recibe (schemas, ejecutar) y le da igual si detras hay un import
local o un proceso hablando JSON-RPC. Eso es desacople de verdad:

    fase 1:  schemas=herramientas.SCHEMAS   ejecutar=herramientas.ejecutar
    fase 5:  schemas=conexion.descubrir_tools()  ejecutar=conexion.ejecutar_tool

Ejecutar:
    python fase5_agente_mcp.py
    python fase5_agente_mcp.py "cancela el pedido PED-2026-0117 si la politica lo permite"
"""
import sys

import agente
import cliente_mcp
import config

PREGUNTA_DEFAULT = "Cancela el pedido PED-2026-0117 si la politica todavia lo permite."

if __name__ == "__main__":
    print(config.resumen(), "\n")
    conexion = cliente_mcp.ConexionMCPSincrona()
    try:
        schemas = conexion.descubrir_tools()
        print(f"Tools via MCP: {[s['function']['name'] for s in schemas]}\n")

        mensajes = []
        pregunta = " ".join(sys.argv[1:]) or PREGUNTA_DEFAULT
        print(f"Tu: {pregunta}")
        while True:
            respuesta, mensajes, traza = agente.ejecutar_agente(
                mensajes_previos=mensajes,
                pregunta=pregunta,
                schemas=schemas,
                ejecutar=conexion.ejecutar_tool,
            )
            print(f"\nSoporteIA: {respuesta}\n")
            pregunta = input("Tu (enter para salir): ").strip()
            if not pregunta:
                break
    finally:
        conexion.cerrar()
