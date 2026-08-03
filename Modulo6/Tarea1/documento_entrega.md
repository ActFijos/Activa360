# Entrega de Tarea 1 - Integración de modelo en proyecto web

## Información del grupo
- Nombre del grupo: Activa360
- Integrantes: Josefina Rojas, Rita Nina y Guillermo Daza Alcalá
- Curso: Módulo 6 - Tarea 1

## Modelo y proveedor usados
- Modelo: `llama3.2:latest`
- Proveedor: Ollama (local)
- Tipo de integración: Backend web + endpoint REST + modelo local

## Enlace al repositorio
- Repositorio: http://github.com/ActFijos/Activa360

## Descripción de la solución
Se integró un modelo de lenguaje en una pequeña aplicación web en Node.js, usando un endpoint REST del backend para enviar un texto real de la app y obtener una respuesta generada por el modelo.

La aplicación está organizada de la siguiente forma:
- Backend: `server.js`
- Interfaz web: `public/index.html`

## Código de la llamada al modelo

Archivo: `server.js`

```js
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: OLLAMA_MODEL,
    prompt,
    stream: false
  })
});
```

## Prompt usado como dato real
Se usó un texto de ayuda relacionado con activos fijos:

```text
Un activo fijo es un bien de larga duración que la empresa utiliza en sus operaciones, como equipos, muebles y vehículos.
```

## Evidencia de ejecución real
Se realizó una llamada real al endpoint de la aplicación con el comando:

```bash
curl -s http://localhost:3003/api/ask -H 'Content-Type: application/json' -d '{"texto":"Un activo fijo es un bien de larga duración que la empresa utiliza en sus operaciones, como equipos, muebles y vehículos."}'
```

Respuesta recibida:

```json
{"respuesta":"¡Claro! Un activo fijo es un bien importante que una empresa utiliza para funcionar, como:\n\n- Equipo de oficina (computadoras, impresoras)\n- Muebles para el trabajo\n- Vehículos para transportar personas o mercancías\n\nEstos objetos duran mucho tiempo y ayudan a la empresa a ser más eficiente."}
```

## Observaciones importantes
- La clave API, si se hubiera usado una API externa, nunca debe colocarse en el código ni subirla al repositorio.
- En este caso, la integración se realizó con Ollama local, por lo que no se requiere clave.

## Conclusión
La integración funcional del modelo dentro del proyecto web quedó demostrada con una ejecución real y una respuesta generada por el modelo, cumpliendo con el objetivo mínimo de la tarea.
