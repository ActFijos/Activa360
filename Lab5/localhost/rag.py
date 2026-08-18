"""La herramienta RAG del agente — hereda el indice del Lab4 (Dia 5).

El agente no "sabe" las politicas: las BUSCA en el vector store que
construimos el Dia 5. Si el indice no existe (repo recien clonado),
este modulo lo reconstruye con el mismo pipeline resumido:
documentos -> chunks con solape -> embeddings -> Chroma persistente.
"""
from typing import List

import chromadb
from chromadb.utils import embedding_functions

import config


def _funcion_embedding():
    if config.EMBED_BACKEND == "openai":
        return embedding_functions.OpenAIEmbeddingFunction(
            model_name=config.EMBED_MODEL,
        )
    if config.EMBED_BACKEND == "ollama":
        return embedding_functions.OllamaEmbeddingFunction(
            url="http://localhost:11434/api/embeddings",
            model_name=config.EMBED_MODEL,
        )
    # default: all-MiniLM-L6-v2 incluido en Chroma, local y gratis
    return embedding_functions.DefaultEmbeddingFunction()


def _abrir_coleccion():
    cliente = chromadb.PersistentClient(path=str(config.DB_DIR))
    return cliente.get_or_create_collection(
        name=config.COLECCION,
        embedding_function=_funcion_embedding(),
        metadata={"hnsw:space": "cosine"},
    )


def _trocear(texto: str, tam: int, solape: int) -> List[str]:
    """Version compacta del chunking del Lab4 (mismos parametros)."""
    trozos, inicio = [], 0
    while inicio < len(texto):
        trozos.append(texto[inicio : inicio + tam])
        inicio += tam - solape
    return trozos


def indexar_si_falta() -> int:
    """Reconstruye el indice solo si la coleccion esta vacia."""
    col = _abrir_coleccion()
    if col.count() > 0:
        return col.count()
    ids, docs, metas = [], [], []
    for archivo in sorted(config.BASE_CONOCIMIENTO.glob("*.md")):
        texto = archivo.read_text(encoding="utf-8")
        for i, trozo in enumerate(_trocear(texto, config.TAM_CHUNK, config.SOLAPE)):
            ids.append(f"{archivo.stem}-{i}")
            docs.append(trozo)
            metas.append({"fuente": archivo.name, "posicion": i})
    col.add(ids=ids, documents=docs, metadatas=metas)
    return col.count()


def consultar(pregunta: str, k: int = None) -> List[dict]:
    """Recuperacion top-k: la misma fase 5 del Lab4, ahora como herramienta."""
    indexar_si_falta()
    col = _abrir_coleccion()
    r = col.query(query_texts=[pregunta], n_results=k or config.TOP_K)
    resultados = []
    for texto, meta, dist in zip(
        r["documents"][0], r["metadatas"][0], r["distances"][0]
    ):
        resultados.append(
            {
                "texto": texto,
                "fuente": meta["fuente"],
                "posicion": meta["posicion"],
                "similitud": round(1 - dist, 3),
            }
        )
    return resultados
