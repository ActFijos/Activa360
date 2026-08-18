"""Chequeo previo del Dia 6 — variante local. Correr ANTES de las fases.

Verifica en orden:
  1. paquetes Python (openai, chromadb, mcp, fastapi)
  2. Ollama respondiendo en el puerto 11434
  3. el modelo de chat descargado y con soporte de TOOLS
  4. una llamada real de tool calling (el minimo del Dia 4)

Ejecutar:
    python verificar_entorno.py
"""
import sys

import httpx

OK = "  [ok] "
FALLO = "  [X]  "


def paso1_paquetes():
    faltan = []
    for paquete in ("openai", "chromadb", "mcp", "fastapi", "dotenv"):
        try:
            __import__(paquete)
            print(OK + paquete)
        except ImportError:
            faltan.append(paquete)
            print(FALLO + paquete + "  -> pip install -r requirements.txt")
    return not faltan


def paso2_ollama():
    import config
    base = config.BASE_URL.replace("/v1", "")
    try:
        r = httpx.get(f"{base}/api/tags", timeout=5)
        r.raise_for_status()
        print(OK + f"Ollama responde en {base}")
        return [m["name"] for m in r.json().get("models", [])]
    except Exception as e:
        print(FALLO + f"Ollama no responde en {base}: {e}")
        print("        -> abre otra terminal y corre: ollama serve")
        return None


def paso3_modelo(modelos):
    import config
    if any(m.startswith(config.MODEL) for m in modelos):
        print(OK + f"modelo {config.MODEL} descargado")
        return True
    print(FALLO + f"modelo {config.MODEL} no esta -> ollama pull {config.MODEL}")
    return False


def paso4_tool_calling():
    import config
    cliente = config.crear_cliente()
    schema = [{
        "type": "function",
        "function": {
            "name": "sumar",
            "description": "Suma dos numeros",
            "parameters": {
                "type": "object",
                "properties": {"a": {"type": "number"}, "b": {"type": "number"}},
                "required": ["a", "b"],
            },
        },
    }]
    try:
        r = cliente.chat.completions.create(
            model=config.MODEL,
            messages=[{"role": "user", "content": "usa la herramienta para sumar 2 y 3"}],
            tools=schema,
        )
        if r.choices[0].message.tool_calls:
            print(OK + "tool calling funciona (el modelo pidio la herramienta)")
            return True
        print(FALLO + "el modelo respondio texto en vez de pedir la herramienta")
        print("        -> revisa que el modelo soporte tools (llama3.2:3b si soporta)")
        return False
    except Exception as e:
        print(FALLO + f"fallo la llamada: {e}")
        return False


if __name__ == "__main__":
    print("1. Paquetes Python")
    if not paso1_paquetes():
        sys.exit(1)
    print("2. Ollama")
    modelos = paso2_ollama()
    if modelos is None:
        sys.exit(1)
    print("3. Modelo de chat")
    if not paso3_modelo(modelos):
        sys.exit(1)
    print("4. Tool calling")
    if not paso4_tool_calling():
        sys.exit(1)
    print("\nTodo listo para el Dia 6. Empieza por: python fase1_bucle_agente.py")
