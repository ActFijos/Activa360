"""FASE 6 — POST /agente: el entregable del Dia 6.

El /buscar del Dia 5 devolvia fragmentos. El /agente de hoy CONVERSA:
recibe la pregunta (y opcionalmente la conversacion previa), corre el
bucle ReAct con las herramientas descubiertas por MCP y devuelve la
respuesta final MAS la traza de pasos — porque un agente sin traza es
imposible de depurar y de auditar.

Ejecutar:
    uvicorn fase6_endpoint:app --reload
    http://127.0.0.1:8000/docs

    curl -X POST http://127.0.0.1:8000/agente \
         -H "Content-Type: application/json" \
         -d '{"pregunta":"Cancela el pedido PED-2026-0117 si la politica lo permite"}'

La confirmacion viaja por la conversacion: el agente responde pidiendo
confirmacion, el cliente reenvia `mensajes` + "si", y recien ahi escribe.
"""
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

import agente
import cliente_mcp
import config

app = FastAPI(title="M6 Dia 6 - Nivel 4: Agente + MCP")

conexion: Optional[cliente_mcp.ConexionMCPSincrona] = None
schemas: List[dict] = []


@app.on_event("startup")
def conectar_mcp():
    """Una sola conexion MCP para todo el servicio (no una por request)."""
    global conexion, schemas
    conexion = cliente_mcp.ConexionMCPSincrona()
    schemas = conexion.descubrir_tools()


class Consulta(BaseModel):
    pregunta: str = Field(min_length=3)
    mensajes: List[dict] = Field(
        default_factory=list,
        description="Conversacion previa (para continuar / confirmar acciones)",
    )
    max_pasos: int = Field(default=config.MAX_PASOS, ge=1, le=10)


class Paso(BaseModel):
    n: int
    tipo: str
    detalle: str


class Respuesta(BaseModel):
    respuesta: str
    mensajes: List[dict]
    traza: List[Paso]
    tokens_entrada: int
    tokens_salida: int


@app.get("/salud")
def salud():
    return {
        "modelo": config.MODEL,
        "tools_mcp": [s["function"]["name"] for s in schemas],
        "max_pasos": config.MAX_PASOS,
    }


@app.get("/agente")
def ayuda_agente():
    return {
        "mensaje": "Este endpoint se usa con POST, no abriendo la URL directamente.",
        "probar_en_navegador": "http://127.0.0.1:8000/docs",
        "metodo": "POST",
        "url": "/agente",
        "body_ejemplo": {
            "pregunta": "Cancela el pedido PED-2026-0117 si la politica lo permite"
        },
    }


@app.post("/agente", response_model=Respuesta)
def preguntar(consulta: Consulta) -> Respuesta:
    respuesta, mensajes, traza = agente.ejecutar_agente(
        mensajes_previos=consulta.mensajes,
        pregunta=consulta.pregunta,
        schemas=schemas,
        ejecutar=conexion.ejecutar_tool,
        max_pasos=consulta.max_pasos,
    )
    return Respuesta(
        respuesta=respuesta,
        mensajes=mensajes,
        traza=[Paso(**p) for p in traza.pasos],
        tokens_entrada=traza.tokens_entrada,
        tokens_salida=traza.tokens_salida,
    )
