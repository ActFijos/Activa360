"""Cliente MCP — descubre herramientas y las traduce al formato OpenAI.

Este modulo hace el puente entre dos mundos:

    MCP  : tools con name / description / inputSchema  (JSON Schema)
    OpenAI: tools con type=function / name / parameters (JSON Schema)

El JSON Schema es el mismo; solo cambia el envoltorio. Por eso la
traduccion son 10 lineas. Eso ES el valor de MCP: un solo formato de
herramienta que cualquier proveedor entiende con un adaptador trivial.
"""
import asyncio
import json
import sys
from contextlib import AsyncExitStack
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVIDOR = StdioServerParameters(
    command=sys.executable,                 # el mismo Python del venv
    args=[str(Path(__file__).parent / "servidor_mcp.py")],
)


class ConexionMCP:
    """Mantiene viva la sesion con el servidor (proceso hijo por stdio)."""

    def __init__(self):
        self._stack = AsyncExitStack()
        self.sesion: ClientSession = None

    async def abrir(self):
        lectura, escritura = await self._stack.enter_async_context(
            stdio_client(SERVIDOR)
        )
        self.sesion = await self._stack.enter_async_context(
            ClientSession(lectura, escritura)
        )
        await self.sesion.initialize()
        return self

    async def cerrar(self):
        await self._stack.aclose()

    async def descubrir_tools(self) -> list:
        """MCP list_tools -> schemas formato OpenAI."""
        respuesta = await self.sesion.list_tools()
        schemas = []
        for tool in respuesta.tools:
            input_schema = getattr(tool, "inputSchema", None) or getattr(tool, "input_schema")
            schemas.append(
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description or "",
                        "parameters": input_schema,
                    },
                }
            )
        return schemas

    async def ejecutar_tool(self, nombre: str, argumentos: dict) -> dict:
        """MCP call_tool -> dict plano para el bucle del agente."""
        resultado = await self.sesion.call_tool(nombre, argumentos)
        # FastMCP devuelve el resultado como texto JSON en content[0]
        texto = resultado.content[0].text if resultado.content else "{}"
        if getattr(resultado, "isError", False) or getattr(resultado, "is_error", False):
            # El error cruza el protocolo como dato: el agente puede leerlo
            # y reaccionar (reintentar, avisar, escalar) en vez de romperse.
            return {"error": texto[:500]}
        try:
            return json.loads(texto)
        except json.JSONDecodeError:
            return {"resultado": texto}


def ejecutar_sincrono(corutina):
    """Ayuda para las fases CLI: corre una corutina desde codigo sincrono."""
    return asyncio.run(corutina)


class ConexionMCPSincrona:
    """Adaptador sincrono: MCP es async, pero nuestro bucle ReAct es sincrono.

    En vez de reescribir el bucle del agente (fase 1) en async, levantamos
    un hilo con su propio event loop y le mandamos las corutinas. Asi el
    agente usa MCP con la MISMA interfaz que herramientas.ejecutar:

        conexion.descubrir_tools()          -> schemas OpenAI
        conexion.ejecutar_tool(nombre, args) -> dict

    Leccion de ingenieria: un adaptador pequeno evita una reescritura grande.
    """

    def __init__(self):
        import threading

        self._loop = asyncio.new_event_loop()
        self._hilo = threading.Thread(target=self._loop.run_forever, daemon=True)
        self._hilo.start()
        self._conexion = self._correr(ConexionMCP().abrir())

    def _correr(self, corutina):
        return asyncio.run_coroutine_threadsafe(corutina, self._loop).result(timeout=120)

    def descubrir_tools(self) -> list:
        return self._correr(self._conexion.descubrir_tools())

    def ejecutar_tool(self, nombre: str, argumentos: dict) -> dict:
        return self._correr(self._conexion.ejecutar_tool(nombre, argumentos))

    def cerrar(self):
        self._correr(self._conexion.cerrar())
        self._loop.call_soon_threadsafe(self._loop.stop)
