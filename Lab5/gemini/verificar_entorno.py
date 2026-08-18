"""Chequeo previo del Dia 6 — variante Gemini.

Verifica en orden:
  1. paquetes Python (openai, chromadb, mcp, fastapi)
  2. Conexión a la API de Gemini usando la API Key configurada
  3. Soporte de Tool calling con Gemini
"""
import sys
import os

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


def paso2_conexion_gemini():
    import config
    print(f"Intentando conectar a Gemini usando el modelo: {config.MODEL}...")
    cliente = config.crear_cliente()
    try:
        r = cliente.chat.completions.create(
            model=config.MODEL,
            messages=[{"role": "user", "content": "Hola, responde solo con la palabra 'OK'"}]
        )
        respuesta = r.choices[0].message.content.strip()
        print(OK + f"Gemini respondió: '{respuesta}'")
        return True
    except Exception as e:
        print(FALLO + f"Error al conectar con la API de Gemini: {e}")
        print("        -> Verifica que tu API key en .env sea correcta y no tenga espacios.")
        return False


def paso3_tool_calling():
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
        return False
    except Exception as e:
        print(FALLO + f"fallo la llamada de tool calling: {e}")
        return False


if __name__ == "__main__":
    print("1. Paquetes Python")
    if not paso1_paquetes():
        sys.exit(1)
    
    # Importar localmente para asegurar que cargue .env primero
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    print("\n2. Conexión a Gemini")
    if not paso2_conexion_gemini():
        sys.exit(1)
        
    print("\n3. Tool calling")
    if not paso3_tool_calling():
        sys.exit(1)
        
    print("\nTodo listo para implementar con Gemini. Empieza por: python gemini/fase1_bucle_agente.py")
