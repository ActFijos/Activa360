"""Configuracion comun del Lab5 — variante local (gratis).

Dia 6 · Nivel 4: el pipeline se convierte en AGENTE. Igual que en Lab3/Lab4,
Ollama expone una API compatible con OpenAI, asi que TODO el codigo del
agente es identico al de chatgpt/: solo cambia esta configuracion.

Requisitos:
    ollama pull llama3.2:3b        (modelo con soporte de tool calling)
    EMBED_BACKEND=chroma           (all-MiniLM-L6-v2, no descarga nada)
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

RAIZ = Path(__file__).resolve().parent.parent
load_dotenv(RAIZ / ".env")

# --- Chat / agente ---------------------------------------------------------
# LocalIA / Ollama exponen una API compatible con OpenAI.
# Primero usamos variables propias de localhost para no pisar chatgpt/.
BASE_URL = (
    os.getenv("LOCALHOST_BASE_URL")
    or os.getenv("LOCALIA_BASE_URL")
    or os.getenv("OPENAI_BASE_URL")
    or "http://localhost:11434/v1"
)
API_KEY = (
    os.getenv("LOCALHOST_API_KEY")
    or os.getenv("LOCALIA_API_KEY")
    or os.getenv("OPENAI_API_KEY")
    or "ollama"
)
MODEL = (
    os.getenv("LOCALHOST_MODEL")
    or os.getenv("LOCALIA_MODEL")
    or os.getenv("OPENAI_MODEL")
    or "llama3.2:3b"
)

# --- Embeddings (para la herramienta RAG) ----------------------------------
#   EMBED_BACKEND=chroma -> all-MiniLM-L6-v2 incluido en Chroma (default)
#   EMBED_BACKEND=ollama -> nomic-embed-text (requiere: ollama pull nomic-embed-text)
EMBED_BACKEND = (
    os.getenv("LOCALHOST_EMBED_BACKEND")
    or os.getenv("EMBED_BACKEND")
    or "chroma"
).lower()
EMBED_MODEL = os.getenv("LOCALHOST_EMBED_MODEL") or os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# --- Rutas del laboratorio -------------------------------------------------
BASE_CONOCIMIENTO = RAIZ / "base_conocimiento"
DATOS = RAIZ / "datos"
DB_DIR = RAIZ / "db_localhost"
COLECCION = "soporteia"

# --- Parametros del agente -------------------------------------------------
MAX_PASOS = int(os.getenv("MAX_PASOS", "6"))   # tope del bucle ReAct
TOP_K = int(os.getenv("TOP_K", "3"))
TAM_CHUNK = int(os.getenv("TAM_CHUNK", "800"))
SOLAPE = int(os.getenv("SOLAPE", "100"))


def crear_cliente() -> OpenAI:
    return OpenAI(base_url=BASE_URL, api_key=API_KEY)


def resumen() -> str:
    return (
        f"agente={MODEL} via {BASE_URL}\n"
        f"embeddings={EMBED_BACKEND}"
        + (f" ({EMBED_MODEL})" if EMBED_BACKEND == "ollama" else " (all-MiniLM-L6-v2 interno)")
        + f"\nmax_pasos={MAX_PASOS} top_k={TOP_K}\n"
        f"db={DB_DIR}"
    )
