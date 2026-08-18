"""FASE 2 — Razonamiento multipaso: la pregunta que UN solo nivel no resuelve.

    "Cancela el pedido PED-2026-0117 si la politica todavia lo permite."

Para responder bien, el agente tiene que ENCADENAR:
    1. buscar_pedido        -> en que estado esta?          (dato vivo, Dia 4)
    2. buscar_documentacion -> que dice la politica?        (RAG, Dia 5)
    3. cancelar_pedido      -> escritura CON confirmacion   (guardrail)

Nadie programo ese orden: el modelo lo decide leyendo las descripciones
de las herramientas. Esa es la definicion practica de "agente".

La conversacion es interactiva para que la confirmacion sea real:
el agente muestra el plan, tu escribes "si", y recien ahi ejecuta.

Ejecutar:
    python fase2_multipaso.py
"""
import agente
import herramientas
import config

PREGUNTA_INICIAL = "Cancela el pedido PED-2026-0117 si la politica todavia lo permite."

if __name__ == "__main__":
    print(config.resumen(), "\n")
    print(f"Tu: {PREGUNTA_INICIAL}")
    mensajes = []
    pregunta = PREGUNTA_INICIAL
    while True:
        respuesta, mensajes, traza = agente.ejecutar_agente(
            mensajes_previos=mensajes,
            pregunta=pregunta,
            schemas=herramientas.SCHEMAS,
            ejecutar=herramientas.ejecutar,
        )
        print(f"\nSoporteIA: {respuesta}\n")
        pregunta = input("Tu (enter para salir): ").strip()
        if not pregunta:
            break

    # Preguntas para probar la rama contraria:
    #   "Cancela el pedido PED-2026-0203"  -> DESPACHADO: la politica lo impide
    #   "Cancela el pedido PED-9999-0000"  -> no existe: el agente debe decirlo
