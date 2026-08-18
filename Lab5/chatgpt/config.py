"""Configuracion comun del Lab5 — variante OpenAI (de paga).

Dia 6 · Nivel 4: el pipeline se convierte en AGENTE. Mismo proveedor que
el Lab4: gpt-4o-mini decide, text-embedding-3-small (o Chroma local) embebe.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

RAIZ = Path(__file__).resolve().parent.parent
load_dotenv(RAIZ / ".env")

# --- Chat / agente ---------------------------------------------------------
# Variables propias de chatgpt/ para poder convivir con localhost/.
API_KEY = os.getenv("CHATGPT_API_KEY") or os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("CHATGPT_MODEL") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- Embeddings (para la herramienta RAG) ----------------------------------
#   EMBED_BACKEND=openai -> text-embedding-3-small (de pago)
#   EMBED_BACKEND=chroma -> all-MiniLM-L6-v2 local y gratis
EMBED_BACKEND = (
    os.getenv("CHATGPT_EMBED_BACKEND")
    or os.getenv("EMBED_BACKEND")
    or "openai"
).lower()
EMBED_MODEL = os.getenv("CHATGPT_EMBED_MODEL") or os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")

# --- Rutas del laboratorio -------------------------------------------------
BASE_CONOCIMIENTO = RAIZ / "base_conocimiento"
DATOS = RAIZ / "datos"
DB_DIR = RAIZ / "db_chatgpt"
COLECCION = "soporteia"

# --- Parametros del agente -------------------------------------------------
MAX_PASOS = int(os.getenv("MAX_PASOS", "6"))   # tope del bucle ReAct
TOP_K = int(os.getenv("TOP_K", "3"))
TAM_CHUNK = int(os.getenv("TAM_CHUNK", "800"))
SOLAPE = int(os.getenv("SOLAPE", "100"))


def crear_cliente() -> OpenAI:
    """Usa CHATGPT_API_KEY o, por compatibilidad, OPENAI_API_KEY."""
    return OpenAI(api_key=API_KEY)


def resumen() -> str:
    return (
        f"agente={MODEL} (OpenAI)\n"
        f"embeddings={EMBED_BACKEND}"
        + (f" ({EMBED_MODEL})" if EMBED_BACKEND == "openai" else " (all-MiniLM-L6-v2 interno)")
        + f"\nmax_pasos={MAX_PASOS} top_k={TOP_K}\n"
        f"db={DB_DIR}"
    )
