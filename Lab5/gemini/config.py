"""Configuracion comun del Lab5 — variante Gemini.

Dia 6 · Nivel 4: el pipeline se convierte en AGENTE. Usamos Gemini a traves de su
punto de enlace compatible con OpenAI.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

RAIZ = Path(__file__).resolve().parent.parent
load_dotenv(RAIZ / ".env")

# --- Chat / agente ---------------------------------------------------------
# Usamos el endpoint compatible de Gemini.
BASE_URL = os.getenv("GEMINI_BASE_URL") or "https://generativelanguage.googleapis.com/v1beta/openai/"
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash"

# --- Embeddings (para la herramienta RAG) ----------------------------------
#   EMBED_BACKEND=chroma -> all-MiniLM-L6-v2 local y gratis (recomendado)
#   EMBED_BACKEND=gemini -> usa el modelo de embeddings de Gemini
EMBED_BACKEND = (
    os.getenv("GEMINI_EMBED_BACKEND")
    or os.getenv("EMBED_BACKEND")
    or "chroma"
).lower()
EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL") or "text-embedding-004"

# --- Rutas del laboratorio -------------------------------------------------
BASE_CONOCIMIENTO = RAIZ / "base_conocimiento"
DATOS = RAIZ / "datos"
DB_DIR = RAIZ / "db_gemini"
COLECCION = "soporteia"

# --- Parametros del agente -------------------------------------------------
MAX_PASOS = int(os.getenv("MAX_PASOS", "6"))   # tope del bucle ReAct
TOP_K = int(os.getenv("TOP_K", "3"))
TAM_CHUNK = int(os.getenv("TAM_CHUNK", "800"))
SOLAPE = int(os.getenv("SOLAPE", "100"))


def crear_cliente() -> OpenAI:
    """Usa GEMINI_API_KEY y la URL del endpoint compatible de Gemini."""
    return OpenAI(api_key=API_KEY, base_url=BASE_URL)


def resumen() -> str:
    return (
        f"agente={MODEL} (Gemini compatible)\n"
        f"embeddings={EMBED_BACKEND}"
        + (f" ({EMBED_MODEL})" if EMBED_BACKEND == "gemini" else " (all-MiniLM-L6-v2 interno)")
        + f"\nmax_pasos={MAX_PASOS} top_k={TOP_K}\n"
        f"db={DB_DIR}"
    )

