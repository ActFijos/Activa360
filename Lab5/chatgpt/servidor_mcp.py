"""Servidor MCP de SoporteIA — el "USB-C" de nuestras herramientas.

Hasta la fase 2, las herramientas viven DENTRO del agente (import directo).
Eso no escala: cada nuevo cliente (otro agente, Claude Desktop, un IDE)
tendria que copiar el codigo. MCP estandariza el enchufe: el servidor
publica las herramientas y CUALQUIER cliente MCP las descubre y las llama.

Ejecutar solo (para inspeccionarlo):
    python servidor_mcp.py            # queda esperando por stdio
    npx @modelcontextprotocol/inspector python servidor_mcp.py

Lo importante: las funciones son LAS MISMAS de herramientas.py.
La logica no se toca; solo cambia el transporte.
"""
try:
    from mcp.server.fastmcp import FastMCP
except ModuleNotFoundError:
    from mcp.server.mcpserver.server import MCPServer as FastMCP

import herramientas

mcp = FastMCP("soporteia")


@mcp.tool()
def buscar_documentacion(pregunta: str) -> dict:
    """Busca en las politicas y documentacion de SoporteIA (devoluciones,
    envios, cancelaciones, garantia, atencion al cliente). Usar SIEMPRE
    antes de afirmar una regla de negocio. Devuelve fragmentos con fuente."""
    return herramientas.buscar_documentacion(pregunta)


@mcp.tool()
def buscar_pedido(numero_pedido: str) -> dict:
    """Consulta el estado actual de un pedido (dato vivo). Ej: PED-2026-0117."""
    return herramientas.buscar_pedido(numero_pedido)


@mcp.tool()
def cancelar_pedido(numero_pedido: str, motivo: str, confirmado: bool = False) -> dict:
    """Cancela un pedido. ESCRITURA: llamar primero con confirmado=false para
    ver el plan; solo confirmado=true si el usuario ya dijo que si."""
    return herramientas.cancelar_pedido(numero_pedido, motivo, confirmado)


@mcp.tool()
def crear_ticket(numero_pedido: str, asunto: str, confirmado: bool = False) -> dict:
    """Abre un ticket de soporte para un humano. ESCRITURA: requiere
    confirmado=true tras el 'si' del usuario."""
    return herramientas.crear_ticket(numero_pedido, asunto, confirmado)


if __name__ == "__main__":
    # stdio: el cliente lanza este proceso y hablan por stdin/stdout (JSON-RPC).
    mcp.run(transport="stdio")
