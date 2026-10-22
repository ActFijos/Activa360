# Actividad: Suite de Tests en Tres Capas

## Objetivo

Trabajen con el **agente de su IDE** en tres capas de la pirámide de pruebas:

1. **Unit**
2. **Integración**
3. **Contrato**

### Meta

Construir una **suite de tests medida y sin duplicados**, que cumpla con las siguientes condiciones:

- Mantener los tests existentes que todavía aportan valor.
- Identificar y marcar como omitidos los tests que ya no aportan, **sin eliminarlos**.
- Eliminar la ejecución de tests duplicados mediante `skip` / `ignore`, según el framework utilizado.
- Incorporar nuevos tests en cada una de las tres capas.
- Medir la cobertura **antes y después**.
- Auditar cada propuesta del agente **test por test**.

> **Importante:** El agente propone los cambios, pero ustedes deben auditar y aprobar cada test.

---

# 1. Medición de cobertura inicial

Ejecuten los **unit tests existentes de la Actividad 1** utilizando la herramienta de cobertura correspondiente al lenguaje/framework del proyecto.

Registren:

- Porcentaje de cobertura inicial.
- Funciones sin ningún test.
- Módulos o archivos sin cobertura.
- Otras áreas relevantes que aparezcan en el reporte.

Luego, pídanle al agente que lea el reporte de cobertura y genere una lista de los **huecos de cobertura** encontrados.

### Resultado esperado

Registrar algo similar a:

| Métrica | Resultado |
|---|---:|
| Cobertura inicial | XX % |
| Funciones sin test | XX |
| Módulos sin test | XX |
| Líneas sin cobertura | XX |

---

# 2. Detección de tests duplicados

Pídanle al agente que analice los tests existentes y detecte posibles duplicados.

Debe considerar como posible duplicado aquellos tests que tengan:

- La misma función bajo prueba.
- Los mismos datos de entrada.
- El mismo `assert` o resultado esperado.

El nombre del test **no debe ser utilizado como único criterio**.

### Auditoría

Ustedes deben confirmar manualmente cada caso identificado por el agente.

> El agente puede marcar como duplicado un test que solamente se parezca a otro. Por eso, cada propuesta debe ser auditada.

### Regla

De cada grupo de tests duplicados:

- Mantener **un test activo**.
- Los demás deben marcarse como **omitidos**.
- No eliminar archivos.
- Escribir el motivo de la omisión.

Según el framework, utilizar:

- `skip`
- `ignore`
- O el mecanismo equivalente.

---

# 3. Tests unitarios para cubrir los huecos

Para los huecos identificados en el reporte de cobertura, pídanle al agente que genere nuevos **unit tests**.

Los tests deben utilizar dobles de prueba (*test doubles*) en las fronteras del sistema, por ejemplo:

- Modelo / base de datos.
- Sistema de archivos / disco.
- Red.
- Servicios externos.

### Auditoría

Auditar cada test generado utilizando el **checklist de la clase**.

Aceptar únicamente los tests que:

- Prueben realmente una unidad de código.
- Sean independientes.
- Utilicen correctamente los dobles.
- Tengan asserts significativos.
- No dependan de red o servicios externos reales.
- No dupliquen pruebas existentes.
- Aporten cobertura o valor real.

Después de incorporar los tests aceptados, volver a ejecutar la medición de cobertura.

### Resultado esperado

| Métrica | Antes | Después |
|---|---:|---:|
| Cobertura | XX % | XX % |
| Funciones sin test | XX | XX |
| Módulos sin test | XX | XX |
| Líneas sin cobertura | XX | XX |

---

# 4. Tests de integración

Seleccionen un **flujo real del producto**.

Por ejemplo:

```text
Entrada del usuario
        ↓
Recuperación
        ↓
Procesamiento
        ↓
Respuesta
```

Para un sistema RAG, por ejemplo:

```text
Pregunta del usuario
        ↓
Embeddings / recuperación
        ↓
Base vectorial
        ↓
Contexto recuperado
        ↓
Generación de respuesta
```

Pídanle al agente que genere **al menos dos tests de integración** que recorran el flujo utilizando las piezas reales del sistema dentro de un espacio temporal o controlado.

Ejemplos:

- Base vectorial temporal.
- Archivos temporales.
- Checkpoints temporales.
- Base de datos temporal.
- Directorios temporales.

### Importante

Los tests deben verificar que el **camino completo realmente se recorrió**, y no solamente comprobar el resultado final.

Por ejemplo, no es suficiente verificar:

```text
respuesta != null
```

También se debe comprobar que:

- La entrada fue procesada.
- Se realizó la recuperación.
- Se utilizó la información recuperada.
- Se recorrieron las etapas esperadas del flujo.

---

# 5. Tests de contrato

Escriban el **esquema del endpoint principal del producto** utilizando:

- JSON Schema
- OpenAPI
- O un mecanismo equivalente.

El esquema debe definir como mínimo:

- Campos.
- Tipos.
- Campos obligatorios.
- Catálogos / valores permitidos.
- Códigos HTTP.
- Estructura de la respuesta.

### Ejemplo conceptual

```json
{
  "type": "object",
  "required": [
    "id",
    "status",
    "response"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    },
    "response": {
      "type": "string"
    }
  }
}
```

Pídanle al agente que genere **tests de contrato** que validen la respuesta del endpoint contra este esquema.

Los tests deben comprobar:

- Presencia de campos.
- Tipos de datos.
- Campos obligatorios.
- Catálogos.
- Estructura de la respuesta.
- Códigos HTTP.

### No validar el contenido generado por el modelo

El contenido textual de la respuesta **no debe evaluarse como criterio principal**, ya que puede variar cuando interviene un modelo de lenguaje.

El objetivo es validar el **contrato estructural del endpoint**.

---

# 6. Auditoría de tests generados por el agente

El agente puede proponer tests para las tres capas, pero cada uno debe ser auditado individualmente.

Registrar:

| Capa | Tests generados | Tests aceptados | Tests descartados | Motivo |
|---|---:|---:|---:|---|
| Unit | XX | XX | XX | ... |
| Integración | XX | XX | XX | ... |
| Contrato | XX | XX | XX | ... |
| **Total** | **XX** | **XX** | **XX** | |

### Motivos posibles para descartar

- Test duplicado.
- No aporta cobertura.
- Assert débil.
- Test mal diseñado.
- Prueba otra capa.
- Dependencia externa innecesaria.
- Dependencia de red.
- Dependencia de un modelo real.
- Resultado no determinista.
- No verifica el comportamiento esperado.
- No cumple el checklist de la clase.

---

# 7. Tests omitidos

Los tests que ya no aporten valor **no deben eliminarse**.

Deben permanecer en el repositorio y marcarse como omitidos mediante el mecanismo correspondiente al framework.

Registrar cada uno:

| Test | Archivo | Motivo | Estado |
|---|---|---|---|
| `test_xxx` | `tests/test_x.py` | Duplicado de `test_yyy` | Omitido |
| `test_zzz` | `tests/test_z.py` | Ya no aporta valor | Omitido |

> **No borrar ningún archivo ni test.**

---

# 8. Tabla de duplicados

Registrar todos los duplicados confirmados:

| Test | Se duplica con | Criterio de duplicación | Decisión |
|---|---|---|---|
| `test_xxx` | `test_yyy` | Misma función, entrada y assert | Omitir |
| `test_aaa` | `test_bbb` | Misma función, entrada y assert | Mantener |

De cada grupo de duplicados debe quedar **un único test activo**.

---

# 9. Corrida final

Al finalizar:

1. Ejecutar todos los tests.
2. Verificar que la suite termine **en verde**.
3. Medir nuevamente la cobertura.
4. Verificar que no existan tests duplicados activos.
5. Confirmar que los tests omitidos permanezcan en el repositorio.
6. Confirmar que exista al menos un test aceptado en cada capa:
   - Unit.
   - Integración.
   - Contrato.

### Condición importante

La corrida final debe realizarse **sin el modelo ni la red encendidos**.

Es decir:

- No depender de un LLM real.
- No depender de APIs externas.
- No depender de Internet.
- Utilizar mocks, stubs, fixtures o recursos temporales cuando corresponda.

---

# 10. Documento de entrega

El documento final debe contener:

## 10.1 Cobertura

- Cobertura inicial: **XX %**
- Cobertura final: **XX %**
- Funciones sin test antes: **XX**
- Funciones sin test después: **XX**
- Módulos sin test antes: **XX**
- Módulos sin test después: **XX**

---

## 10.2 Tabla de duplicados

Incluir:

- Test.
- Test con el que se duplica.
- Criterio.
- Decisión.

---

## 10.3 Tests omitidos

Incluir:

- Nombre del test.
- Archivo.
- Motivo de la omisión.
- Mecanismo utilizado (`skip`, `ignore`, etc.).

---

## 10.4 Tests generados y aceptados

Por cada capa:

- Cantidad de tests generados por el agente.
- Cantidad aceptada.
- Cantidad descartada.
- Motivo de cada descarte.

| Capa | Generados | Aceptados | Descartados | Observaciones |
|---|---:|---:|---:|---|
| Unit | XX | XX | XX | ... |
| Integración | XX | XX | XX | ... |
| Contrato | XX | XX | XX | ... |

---

## 10.5 Esquema del endpoint principal

Incluir el **JSON Schema, OpenAPI o equivalente** utilizado para validar el contrato.

---

## 10.6 Evidencia de la corrida final

Incluir la salida de la ejecución final de los tests, demostrando que la suite termina **en verde**.

Ejemplo:

```text
================ test session starts ================

Unit tests ............... PASSED
Integration tests ........ PASSED
Contract tests ........... PASSED

================  XX passed in XXs  ==================
```

---

# Criterios para considerar la actividad completa

La actividad estará completa únicamente si se cumplen **todos** los siguientes puntos:

- [ ] Cobertura medida antes de los cambios.
- [ ] Cobertura medida después de los cambios.
- [ ] Huecos de cobertura identificados.
- [ ] Tests duplicados identificados y auditados.
- [ ] Tests duplicados marcados como omitidos, sin eliminarlos.
- [ ] Tests que ya no aportan valor marcados como omitidos.
- [ ] Nuevos unit tests generados y auditados.
- [ ] Nuevos tests de integración generados y auditados.
- [ ] Nuevos tests de contrato generados y auditados.
- [ ] Al menos **un test aceptado por cada capa**.
- [ ] Endpoint principal documentado mediante un esquema.
- [ ] Contrato validado mediante tests.
- [ ] Corrida final completamente en verde.
- [ ] Corrida final realizada sin modelo ni red encendidos.
- [ ] No se eliminó ningún archivo de tests.
- [ ] La suite final no contiene duplicados activos.

> **Sin cobertura antes y después, y sin al menos un test aceptado por capa, la actividad está incompleta.**