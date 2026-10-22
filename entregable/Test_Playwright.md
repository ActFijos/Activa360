Qué deben hacer:

* Listar todos los flujos de su aplicación, uno por línea: qué hace la persona y qué debe ver al final. Esa lista define el alcance: lo que no está en ella, no se probó.  
* Correr el Planner sección por sección (nunca sobre toda la app de una vez) y auditar cada plan: casos propuestos, aceptados, corregidos y descartados, con el motivo. Un caso que verifica la redacción del modelo se corrige para verificar fuente, estado o ticket.  
* Generar con el Generator un test por cada caso aceptado y pasar cada test por las cinco preguntas E2E: localizador de persona (getByRole, getByLabel, getByText o data-testid), sin esperas fijas, verifica lo que la interfaz promete y no la redacción del modelo, pequeño e independiente (empieza con page.goto), datos propios del test. Lo que falla se corrige antes de aceptar; lo que no se puede corregir se descarta y se anota.  
* Agregar a su producto los roles, etiquetas o data-testid que hagan falta para que los localizadores sean estables, y anotarlos.  
* Correr la suite completa con npx playwright test (deacuerdo al lenguaje q estes usando con playwright) hasta que esté en verde, guardar el reporte HTML o las trazas y el registro de tokens del Planner y del Generator.

Qué deben entregar (un solo archivo por equipo, PDF o Word, más la carpeta tests/ y specs/ comprimida en .zip o el enlace al repositorio):

* Equipo y producto: integrantes, nombre del producto, agente/IDE y modelo usados.  
* Inventario de flujos: la lista completa de flujos de la aplicación y el nombre del test que cubre cada uno. OBLIGATORIO.  
* Tabla de auditoría: una fila por cada test generado con caso del plan, archivo, veredicto (aceptado / corregido / descartado), pregunta de las cinco que falló y qué se cambió; al final, totales de casos del Planner y de tests del Generator. OBLIGATORIO.  
* Anclas agregadas al producto: roles, etiquetas o data-testid añadidos y en qué pantalla.  
* Captura de la terminal con la suite completa en verde: nombre de los tests, cantidad de tests pasados y tiempo total, sin recortar el resumen. Captura del reporte HTML de Playwright con la lista de tests de esa misma corrida. Si un test quedó descartado o en rojo controlado, capturarlo también. Cada imagen va anotada sobre la propia captura (una flecha o un recuadro con la nota de qué se está mostrando), no solo descrita en el texto. La corrección se hace sobre estas capturas: lo que no esté capturado, se considera no ejecutado.  
* Tokens: entrada y salida del Planner y promedio por test del Generator.  
* Lo que no se pudo probar en E2E y por qué (va a evals).

&nbsp;