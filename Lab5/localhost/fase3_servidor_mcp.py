"""FASE 3 — Levantar el servidor MCP y mirarlo por dentro.

Un servidor MCP por stdio no se "conecta a un puerto": es un proceso que
habla JSON-RPC por stdin/stdout con quien lo lanzo. Por eso este script
no hace nada visible si lo corres solo — y ESA es la leccion.

Para inspeccionarlo con interfaz grafica (requiere Node):
    npx @modelcontextprotocol/inspector python servidor_mcp.py

Para inspeccionarlo sin Node, este script se conecta como cliente minimo
y lista lo que el servidor publica:

Ejecutar:
    python fase3_servidor_mcp.py
"""
import cliente_mcp


async def main():
    conexion = await cliente_mcp.ConexionMCP().abrir()
    try:
        respuesta = await conexion.sesion.list_tools()
        print(f"Servidor 'soporteia' publica {len(respuesta.tools)} herramientas:\n")
        for tool in respuesta.tools:
            input_schema = getattr(tool, "inputSchema", None) or getattr(tool, "input_schema")
            print(f"  - {tool.name}")
            print(f"      {(tool.description or '').strip().splitlines()[0]}")
            requeridos = input_schema.get("required", [])
            print(f"      args: {list(input_schema.get('properties', {}))}"
                  f"  requeridos: {requeridos}\n")
    finally:
        await conexion.cerrar()


if __name__ == "__main__":
    cliente_mcp.ejecutar_sincrono(main())
