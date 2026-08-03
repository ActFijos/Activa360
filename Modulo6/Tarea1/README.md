# Activos Fijos + IA Web

Proyecto mínimo en Node.js que integra un modelo local con Ollama y expone una interfaz web simple.

## Requisitos

- Node.js
- Ollama corriendo localmente
- Modelo `llama3.2:latest` (o cambia `OLLAMA_MODEL` si usas otro)

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Luego abre:

```text
http://localhost:3001
```

Si necesitas usar otro modelo, puedes ejecutar:

```bash
OLLAMA_MODEL=llama3.2:latest npm start
```

## Nota

Este proyecto usa el texto de ayuda de activos fijos como dato real para construir el prompt.
