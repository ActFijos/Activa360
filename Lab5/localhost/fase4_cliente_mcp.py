"""FASE 4 — Descubrir y llamar herramientas via MCP (sin LLM todavia).

Aqui esta el momento clave del dia: el cliente NO importa herramientas.py.
No sabe que existe. Descubre las herramientas por el protocolo y las llama
por el protocolo. Si manana el servidor agrega una herramienta nueva,
este cliente la ve sin cambiar una linea.

Ejecutar:
    python fase4_cliente_mcp.py
"""
import json

import cliente_mcp


async def main():
    conexion = await cliente_mcp.ConexionMCP().abrir()
    try:
        # 1) Descubrimiento -> schemas formato OpenAI (listos para el agente)
        schemas = await conexion.descubrir_tools()
        print("Herramientas descubiertas (ya en formato OpenAI):")
        for s in schemas:
            print(f"  - {s['function']['name']}")

        # 2) Llamada directa, sin modelo: el protocolo puro
        print("\n> call_tool buscar_pedido(PED-2026-0117)")
        r = await conexion.ejecutar_tool("buscar_pedido", {"numero_pedido": "PED-2026-0117"})
        print(json.dumps(r, ensure_ascii=False, indent=2))

        print("\n> call_tool buscar_documentacion('cuando se puede cancelar')")
        r = await conexion.ejecutar_tool(
            "buscar_documentacion", {"pregunta": "cuando se puede cancelar un pedido"}
        )
        for frag in r.get("fragmentos", []):
            print(f"  [{frag['fuente']} #{frag['posicion']}] similitud={frag['similitud']}")
        if "error" in r:
            print(f"  (error del servidor: {r['error'][:120]})")

        # 3) La escritura sin confirmar NO escribe (el guardrail viaja con la tool)
        print("\n> call_tool cancelar_pedido(confirmado=false)")
        r = await conexion.ejecutar_tool(
            "cancelar_pedido",
            {"numero_pedido": "PED-2026-0158", "motivo": "prueba", "confirmado": False},
        )
        print(json.dumps(r, ensure_ascii=False, indent=2))
    finally:
        await conexion.cerrar()


if __name__ == "__main__":
    cliente_mcp.ejecutar_sincrono(main())
