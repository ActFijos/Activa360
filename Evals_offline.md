Apliquen a su proyecto lo visto en el material y el laboratorio de Evals offline: medir la calidad de su IA con un dataset dorado, métricas, un juez y una compuerta que diga PASA o NO PASA. Esta tarea se defiende, ya que es el lado probabilístico del triángulo. Usen el laboratorio de Evals offline como guía.

Una sola función: la que responde, clasifica o genera (ej. el asistente que responde consultas). Escriban en una línea qué debe hacer bien; eso es lo que van a medir.  
(no 12 por cada módulo del sistema). Cada caso lleva pregunta, puntos clave esperados, contexto y frases prohibidas. Cubran los 5 tipos de caso vistos en clase y marquen al menos 3 como críticos.  
Son dos versiones de su función que cambian una sola cosa (prompt, modelo o contexto). Guardar las respuestas hace que la eval sea reproducible.  
completitud (¿cubre los puntos clave?), sin prohibidos (¿evita lo que no debe decir?) y fidelidad (¿se apoya en el contexto?). La fidelidad la califica un juez con rúbrica escrita.  
Califiquen a mano al menos 6 casos, compárenlos con el juez y reporten el % de acuerdo y el kappa.  
Definan umbrales (ej. completitud ≥ 0,85, fidelidad ≥ 0,85, cero críticos fallados). El script termina con código 0 \= PASA o 1 \= NO PASA.  
Revisen qué casos fallaron en v1 y v2, corrijan su función y graben la v3. Con la v3, la compuerta debe terminar en 0 \= PASA.

* dataset/: el dataset dorado.  
* respuestas/: las respuestas grabadas de v1, v2 y v3.  
* evals/: el script con métricas, juez y compuerta.  
* evidencia/: captura de la compuerta con la v3 en código 0\.  
* Documento final en PDF: cómo correrlo y la tabla v1, v2 y v3.  
* Un solo archivo .zip por equipo, adjuntado en Classroom, con el nombre M7\_Evals\_NombreEquipo.zip.  
* Solo los archivos de evals, no todo el proyecto.  
* En el documento final: cada archivo explicado (qué contiene y para qué se creó), cómo seleccionaron los 12 casos y por qué eligieron esos, y qué corrigieron en la v3.  
* El documento final va en formato PDF. Por favor generen este formato: si se entrega en .md, tendrá un descuento de 20 pts.

Ejecuten solo el camino feliz, es decir, la eval con la v3 pasando la compuerta, y expliquen brevemente qué hicieron. Entre ejecutar y explicar, no más de 2 minutos.

Evals en IA (todos los grupos): martes 29 de septiembre de 2026, hasta las 23:59. La tarea se publica en Classroom el lunes 28, pero la fecha máxima ya queda fijada desde ahora. Es requisito para defender haber entregado todas las tareas del módulo dentro de sus fechas límite y tenerlas ya calificadas. Si no ven su nota en alguna tarea y/o evaluación, por favor escríbanme a mi número personal para revisarlo a tiempo. 