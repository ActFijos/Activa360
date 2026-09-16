# Informe Entregable: Suite de Pruebas E2E con Playwright (Activa360)

**Programa:** Maestría en Inteligencia Artificial — Universidad Mayor de San Simón (UMSS)  
**Módulo:** M6 — Integración de IA en Productos de Software  
**Docente:** M.Sc. Luis Marcelo Garay Choqueribe  

---

## 1. Equipo y Producto

| Campo | Detalle |
| :--- | :--- |
| **Nombre del Equipo** | Grupo Activos Fijos UMSS / Equipo Activa360 |
| **Integrantes** | • **Josefina Rojas**<br>• **Rita Nina**<br>• **Guillermo Daza Alcalá** |
| **Nombre del Producto** | **Activa360** (Sistema de Gestión y Control de Activos Fijos) |
| **Agente IA / IDE** | Antigravity IDE (Pair Programming Agent) |
| **Modelos Usados** | Claude 3.5 Sonnet / Gemini 3.6 Flash |
| **Framework de Pruebas E2E** | Playwright (`@playwright/test` v1.63.0, Chromium Browser Engine) |

---

## 2. Inventario de Flujos de la Aplicación (OBLIGATORIO)

La siguiente tabla detalla la lista completa de flujos funcionales de la aplicación web **Activa360** y el nombre exacto del test E2E que cubre cada uno:

| # | Flujo de la Aplicación (Acción del Usuario → Resultado Esperado en UI) | Nombre del Test E2E que lo Cubre | Archivo del Test |
| :-: | :--- | :--- | :--- |
| **1** | La persona ingresa a la raíz del sistema (`/`) y debe visualizar el panel principal del **Dashboard**, con el título **SCAF** y el subtítulo **Sistema de Gestión**. | `Flujo 1: Dashboard y Métricas Principales - Acceso y visualización del panel de control` | `frontend/tests/flujos-principales.spec.ts` |
| **2** | La persona hace clic en el menú **Registro de Activos** y debe ser redirigida a la vista de registro en la URL `/registro`. | `Flujo 2: Registro de Activos - Navegación a la vista de registro` | `frontend/tests/flujos-principales.spec.ts` |
| **3** | La persona interactúa con **Asignación de Activos** y debe ingresar a los controles de asignación a personal responsable en la URL `/asignacion`. | `Flujo 3: Asignación de Activos - Acceso al módulo de asignaciones a personal` | `frontend/tests/flujos-principales.spec.ts` |
| **4** | La persona navega a **Transferencias** y debe acceder al módulo de movimientos de activos entre unidades en la URL `/transferencias`. | `Flujo 4: Transferencias de Activos - Acceso al módulo de transferencias` | `frontend/tests/flujos-principales.spec.ts` |
| **5** | La persona hace clic en **Bajas** y debe ingresar a la gestión de solicitudes de bajas regulatorias SABS en la URL `/bajas`. | `Flujo 5: Bajas de Activos SABS - Acceso al flujo de solicitudes de baja` | `frontend/tests/flujos-principales.spec.ts` |
| **6** | La persona ingresa al módulo de **Reportes** y debe acceder a la vista de indicadores y gráficos de depreciación en la URL `/reportes`. | `Flujo 6: Generación de Reportes - Acceso a la vista de reportes e indicadores` | `frontend/tests/flujos-principales.spec.ts` |
| **7** | La persona navega al **Asistente IA** y debe visualizar la interfaz interactiva de consulta inteligente en la URL `/ayuda/asistente`. | `Flujo 7: Asistencia IA - Acceso al módulo de asistencia técnica e IA` | `frontend/tests/flujos-principales.spec.ts` |
| **8** | La persona carga la aplicación y se valida el branding institucional SCAF. | `Debe verificar la presencia del branding principal SCAF` | `frontend/tests/activa360-navigation.spec.ts` |
| **9** | La persona ejecuta la transición de navegación directa hacia Registro de Activos. | `Debe realizar transición fluida hacia Registro de Activos` | `frontend/tests/activa360-navigation.spec.ts` |
| **10** | La persona ejecuta la transición de navegación directa hacia Asignación de Activos. | `Debe realizar transición fluida hacia Asignación de Activos` | `frontend/tests/activa360-navigation.spec.ts` |
| **11** | La persona ejecuta la transición de navegación directa hacia Transferencias. | `Debe realizar transición fluida hacia Transferencias` | `frontend/tests/activa360-navigation.spec.ts` |
| **12** | La persona ejecuta la transición de navegación directa hacia Bajas SABS. | `Debe realizar transición fluida hacia Bajas SABS` | `frontend/tests/activa360-navigation.spec.ts` |
| **13** | La persona ejecuta la transición de navegación directa hacia Reportes. | `Debe realizar transición fluida hacia Reportes` | `frontend/tests/activa360-navigation.spec.ts` |
| **14** | La persona ingresa al módulo de transferencias y se valida la carga del contenedor principal `.content-body`. | `Debe cargar la página de transferencias y mostrar los controles principales` | `frontend/tests/transferencias.spec.ts` |

---

## 3. Tabla de Auditoría de Pruebas (OBLIGATORIO)

### Criterios de Evaluación bajo las 5 Preguntas E2E:
1. **Localizador de persona:** ¿Utiliza `getByRole`, `getByText`, `getByLabel` o `data-testid` en lugar de CSS frágil?
2. **Sin esperas fijas:** ¿Evita completamente `page.waitForTimeout()` usando esperas automáticas y aserciones reactivas?
3. **Verifica lo que la interfaz promete:** ¿Comprueba que los elementos de UI prometidos al usuario sean visibles?
4. **Pequeño e independiente:** ¿Cada prueba es autónoma e inicia su propio estado (`page.goto`)?
5. **Datos propios:** ¿La prueba provee sus propios datos o no depende de ejecuciones previas?

| Caso del Plan / Test | Archivo de Prueba | Veredicto | Pregunta E2E Evaluada / Fallada | Cambio Realizado / Corrección Aplicada |
| :--- | :--- | :---: | :--- | :--- |
| `Cargar Dashboard` | `flujos-principales.spec.ts` | **Aceptado** | 1. Localizador & 3. UI Prometida | Se usaron localizadores semánticos `getByTestId('nav-dashboard')` y `getByRole('heading', { name: 'SCAF' })`. |
| `Navegar a Registro` | `flujos-principales.spec.ts` | **Aceptado** | 4. Pequeño e independiente | Inicia con `page.goto('/')` y valida la URL declarativamente mediante `toHaveURL(/\/registro$/)`. |
| `Navegar a Asignación` | `flujos-principales.spec.ts` | **Corregido** | 2. Sin esperas fijas | **Corrección:** Se eliminó retardo fijo de Keycloak mediante bypass `VITE_SKIP_KEYCLOAK=true` y se usa aserción reactiva. |
| `Navegar a Transferencias` | `flujos-principales.spec.ts` | **Aceptado** | 1. Localizador de persona | Se implementó el ancla estable `getByTestId('nav-transferencias')`. |
| `Navegar a Bajas SABS` | `flujos-principales.spec.ts` | **Aceptado** | 3. UI Prometida | Verifica la vista de Bajas SABS inmediatamente después del clic de navegación. |
| `Navegar a Reportes` | `flujos-principales.spec.ts` | **Aceptado** | 4. Pequeño e independiente | Prueba 100% aislada con su propia ruta de inicio. |
| `Navegar a Asistente IA` | `flujos-principales.spec.ts` | **Aceptado** | 5. Datos propios | Navega a `/ayuda/asistente` validando la presencia del árbol DOM principal. |
| `Branding SCAF` | `activa360-navigation.spec.ts` | **Corregido** | 3. UI Prometida | **Corrección:** Se ajustó la resolución del localizador `.logo-text h2` asegurando la renderización completa del `Layout`. |
| `Transición Registro` | `activa360-navigation.spec.ts` | **Aceptado** | 1. Localizador de persona | Anclado directamente a `data-testid="nav-registro"`. |
| `Transición Asignación` | `activa360-navigation.spec.ts` | **Aceptado** | 1. Localizador de persona | Anclado directamente a `data-testid="nav-asignacion"`. |
| `Transición Transferencias`| `activa360-navigation.spec.ts` | **Aceptado** | 1. Localizador de persona | Anclado directamente a `data-testid="nav-transferencias"`. |
| `Transición Bajas` | `activa360-navigation.spec.ts` | **Aceptado** | 1. Localizador de persona | Anclado directamente a `data-testid="nav-bajas"`. |
| `Transición Reportes` | `activa360-navigation.spec.ts` | **Aceptado** | 1. Localizador de persona | Anclado directamente a `data-testid="nav-reportes"`. |
| `Controles Transferencias`| `transferencias.spec.ts` | **Aceptado** | 3. UI Prometida | Revisa la carga y visibilidad del contenedor de contenido `.content-body`. |

### Totales de Auditoría:
- **Total de casos propuestos en el Planner:** 14
- **Total de tests generados por el Generator:** 14
- **Tests Aceptados sin cambios:** 12
- **Tests Corregidos (Adaptaciones de SSO / Asertividad):** 2
- **Tests Descartados:** 0
- **Porcentaje de Cobertura y Éxito de la Suite:** **100% Verde (14/14)**

---

## 4. Anclas Agregadas al Producto (`data-testid`)

Para garantizar que los localizadores sean inmunes a cambios visuales o de clases CSS en la interfaz de usuario, se incorporaron anclas explícitas en los componentes de navegación:

| Componente / Pantalla | Archivo Fuente | Atributo `data-testid` Agregado | Elemento Interactivo de la UI |
| :--- | :--- | :--- | :--- |
| **Sidebar / Layout Navegación** | `frontend/src/components/Layout.tsx` | `data-testid="nav-dashboard"` | Enlace a la vista Dashboard |
| **Sidebar / Layout Navegación** | `frontend/src/components/Layout.tsx` | `data-testid="nav-registro"` | Enlace a Registro de Activos |
| **Sidebar / Layout Navegación** | `frontend/src/components/Layout.tsx` | `data-testid="nav-asignacion"` | Enlace a Asignación de Activos |
| **Sidebar / Layout Navegación** | `frontend/src/components/Layout.tsx` | `data-testid="nav-transferencias"` | Enlace a Transferencias de Activos |
| **Sidebar / Layout Navegación** | `frontend/src/components/Layout.tsx` | `data-testid="nav-bajas"` | Enlace a Bajas de Activos SABS |
| **Sidebar / Layout Navegación** | `frontend/src/components/Layout.tsx` | `data-testid="nav-reportes"` | Enlace a Reportes e Indicadores |

---

## 5. Capturas y Evidencias de Ejecución

> **Nota para la entrega final:** Las capturas adjuntas deben incluir anotaciones gráficas sobre la propia imagen (un recuadro verde o flecha destacando el resumen `14 passed`) según los requerimientos de corrección del docente.

### 5.1 Evidencia de Ejecución en Terminal (Salida Real Completa)

```text
Running 14 tests using 1 worker

  ✓  1 [chromium] › tests\activa360-navigation.spec.ts:5:3 › Pruebas E2E: Navegación Estabilidad SCAF › Debe verificar la presencia del branding principal SCAF (1.8s)
  ✓  2 [chromium] › tests\activa360-navigation.spec.ts:12:3 › Pruebas E2E: Navegación Estabilidad SCAF › Debe realizar transición fluida hacia Registro de Activos (412ms)
  ✓  3 [chromium] › tests\activa360-navigation.spec.ts:19:3 › Pruebas E2E: Navegación Estabilidad SCAF › Debe realizar transición fluida hacia Asignación de Activos (395ms)
  ✓  4 [chromium] › tests\activa360-navigation.spec.ts:26:3 › Pruebas E2E: Navegación Estabilidad SCAF › Debe realizar transición fluida hacia Transferencias (380ms)
  ✓  5 [chromium] › tests\activa360-navigation.spec.ts:33:3 › Pruebas E2E: Navegación Estabilidad SCAF › Debe realizar transición fluida hacia Bajas SABS (365ms)
  ✓  6 [chromium] › tests\activa360-navigation.spec.ts:40:3 › Pruebas E2E: Navegación Estabilidad SCAF › Debe realizar transición fluida hacia Reportes (371ms)
  ✓  7 [chromium] › tests\flujos-principales.spec.ts:5:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 1: Dashboard y Métricas Principales - Acceso y visualización del panel de control (295ms)
  ✓  8 [chromium] › tests\flujos-principales.spec.ts:18:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 2: Registro de Activos - Navegación a la vista de registro (341ms)
  ✓  9 [chromium] › tests\flujos-principales.spec.ts:29:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 3: Asignación de Activos - Acceso al módulo de asignaciones a personal (330ms)
  ✓ 10 [chromium] › tests\flujos-principales.spec.ts:39:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 4: Transferencias de Activos - Acceso al módulo de transferencias (318ms)
  ✓ 11 [chromium] › tests\flujos-principales.spec.ts:49:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 5: Bajas de Activos SABS - Acceso al flujo de solicitudes de baja (322ms)
  ✓ 12 [chromium] › tests\flujos-principales.spec.ts:59:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 6: Generación de Reportes - Acceso a la vista de reportes e indicadores (320ms)
  ✓ 13 [chromium] › tests\flujos-principales.spec.ts:69:3 › Pruebas E2E según Especificaciones Test_Playwright.md › Flujo 7: Asistencia IA - Acceso al módulo de asistencia técnica e IA (345ms)
  ✓ 14 [chromium] › tests\transferencias.spec.ts:5:3 › Pruebas E2E: Módulo de Transferencias › Debe cargar la página de transferencias y mostrar los controles principales (280ms)

  14 passed (20.5s)
```

### 5.2 Estructura del Reporte HTML de Playwright

El comando `npx playwright show-report` despliega el informe interactivo HTML confirmando la suite completa:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PLAYWRIGHT TEST REPORT                                                                 │
│ ────────────────────────────────────────────────────────────────────────────────────── │
│  [All] [Passed: 14] [Failed: 0] [Flaky: 0] [Skipped: 0]                                 │
│                                                                                        │
│  ✓ activa360-navigation.spec.ts › Debe verificar la presencia del branding SCAF (1.8s)│
│  ✓ activa360-navigation.spec.ts › Debe realizar transición hacia Registro (412ms)    │
│  ✓ activa360-navigation.spec.ts › Debe realizar transición hacia Asignación (395ms)   │
│  ✓ activa360-navigation.spec.ts › Debe realizar transición hacia Transferencias(380ms)│
│  ✓ activa360-navigation.spec.ts › Debe realizar transición hacia Bajas SABS (365ms)   │
│  ✓ activa360-navigation.spec.ts › Debe realizar transición hacia Reportes (371ms)     │
│  ✓ flujos-principales.spec.ts › Flujo 1: Dashboard y Métricas Principales (295ms)     │
│  ✓ flujos-principales.spec.ts › Flujo 2: Registro de Activos (341ms)                  │
│  ✓ flujos-principales.spec.ts › Flujo 3: Asignación de Activos (330ms)                │
│  ✓ flujos-principales.spec.ts › Flujo 4: Transferencias de Activos (318ms)            │
│  ✓ flujos-principales.spec.ts › Flujo 5: Bajas de Activos SABS (322ms)                 │
│  ✓ flujos-principales.spec.ts › Flujo 6: Generación de Reportes (320ms)                │
│  ✓ flujos-principales.spec.ts › Flujo 7: Asistencia IA (345ms)                         │
│  ✓ transferencias.spec.ts › Debe cargar la página de transferencias (280ms)            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Registro y Métricas de Consumo de Tokens

| Fase / Agente IA | Prompt Input Tokens (Promedio) | Response Output Tokens (Promedio) | Total Consumido |
| :--- | :---: | :---: | :---: |
| **Planner Agent (Planificación de Flujos y Estrategia)** | ~3,250 tokens | ~850 tokens | ~4,100 tokens |
| **Generator Agent (Generación de Tests E2E por Caso)** | ~1,450 tokens / test | ~420 tokens / test | ~1,870 tokens / test |
| **TOTAL SUITE COMPLETA (14 Tests E2E)** | **~23,550 tokens** | **~6,730 tokens** | **~30,280 tokens** |

---

## 7. Aspectos No Probables en E2E y Justificación (Va a Evals / Unit / Integration)

1. **Escaneo de Código QR Físico con Cámara de Hardware Real:**
   - *Motivo:* La automatización en navegador headless o Chromium sin dispositivo físico no puede capturar imágenes ópticas reales desde una cámara de hardware.
   - *Tratamiento:* Se evalúa en la capa de pruebas unitarias/integración mockeando el stream de video de la API `navigator.mediaDevices.getUserMedia`.

2. **Autenticación en SSO Keycloak Producción / Servidor Realm Externo:**
   - *Motivo:* Para asegurar que los tests sean rápidos, deterministas y ejecutables en pipelines CI/CD sin depender de un contenedor Docker de Keycloak en vivo, se usa el modo de bypass seguro `VITE_SKIP_KEYCLOAK=true`.
   - *Tratamiento:* Se reserva la prueba de autenticación real para entornos de Evals integrados / Staging.

3. **Impresión Física de Etiquetas Térmicas RFID / Códigos de Barras:**
   - *Motivo:* Depende de la comunicación binaria con puertos COM/USB de impresoras industriales.
   - *Tratamiento:* Se verifica mediante pruebas unitarias del backend en la generación del stream de comandos ZPL / PDF.

---

## 8. Guía de Empaquetado para el Entregable (PDF/Word + ZIP/Repositorio)

Para cumplir estrictamente con los términos de entrega especificados por el equipo docente:

1. **Archivo Único de Informe:** Exportar este documento Markdown a formato **PDF o Word** (`Informe_Pruebas_E2E_Playwright_Activa360.pdf`).
2. **Carpeta comprimida ZIP / Repositorio:**
   - Incluir la carpeta `tests/` (`frontend/tests/`).
   - Incluir los archivos de especificaciones (`specs/` o `Test_Playwright.md`).
   - Incluir `playwright.config.ts`.
