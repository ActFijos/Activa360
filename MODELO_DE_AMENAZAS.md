# Modelo de amenazas del asistente de soporte (ejemplo de la clase)

| Elemento | Pregunta | En este laboratorio |
|---|---|---|
| **Activos** | ¿Qué queremos proteger? | Código interno (sintético), datos de clientes, dinero (reembolsos), integridad de la política de negocio, disponibilidad y costo (tokens) |
| **Actores** | ¿Quién podría atacar? | Un cliente malicioso; un tercero que envía un documento; quien pueda dejar un archivo en la base de conocimiento; un empleado curioso |
| **Puntos de entrada** | ¿Por dónde entra información? | Mensaje del usuario; documento adjunto; archivos de la base de conocimiento; resultados de herramientas |
| **Fronteras de confianza** | ¿Dónde cambia el nivel de confianza? | Usuario → aplicación (no confiable); aplicación → prompt del sistema (confiable); documento/base de conocimiento → contexto (NO confiable aunque parezca interno); modelo → herramientas (el modelo NO es confiable para decidir acciones) |
| **Ataques** | ¿Qué podría intentar? | Inyección directa e indirecta, extracción del contexto oculto, divulgación de datos de otros clientes, abuso de la herramienta de reembolso, envenenamiento de la base de conocimiento, consumo sin límite |
| **Impacto** | ¿Qué pasa si lo consigue? | Fuga de datos, pérdida económica, decisiones basadas en una política falsa, costo descontrolado |
| **Mitigaciones** | ¿Qué control reduce el riesgo? | Aislamiento de secretos, mínimo privilegio en el contexto, separación datos/instrucciones, allow-list y política de herramientas fuera del modelo, confirmación humana, procedencia por hash, validación de salida, límites de consumo, registro y tests de regresión |

Diagrama de flujo (dónde hay riesgo):

```
Usuario ──► Aplicación ──► Prompt / Contexto ──► Modelo ──► Herramientas ──► Datos / APIs
  (1)          (2)               (3)              (4)           (5)              (6)
```

1. Entrada no confiable (inyección directa, consumo).
2. Aquí se deciden identidad, límites y qué entra al contexto.
3. Aquí conviven instrucciones confiables y datos no confiables (inyección indirecta, envenenamiento).
4. Salida probabilística: puede obedecer al atacante.
5. El modelo PROPONE, la aplicación DECIDE (política de herramientas).
6. Mínimo privilegio: la herramienta solo alcanza lo que la sesión autoriza.
