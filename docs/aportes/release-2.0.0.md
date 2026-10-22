# Aportes Individuales por Release — Activa360

## 0. Metadatos

| Campo | Valor |
| :---- | :---- |
| Producto | Activa360 – Sistema Inteligente de Gestión de Activos Fijos |
| Grupo | Grupo 3 (Activos Fijos) |
| Release evaluable | `release/2.0.0` |
| Sesión asociada | S12 (Defensa Final) |
| Fecha de cierre | 27/05/2026 |
| Integrantes del grupo (n) | Josefina Rojas, Rita Nina, Guillermo Daza Alcalá (n = 3) |
| Branch del release | `release/2.0.0` |
| Commit de cierre (HEAD) | `957d2c8` |

---

## 1. Tabla de tareas atribuidas

| # | Integrante | Tarea concreta | Categoría | Referencia | Fecha |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Josefina Rojas | Especificación detallada de casos de uso (FSD-UC-001 al 005) | FSD | `docs/FSD_Activos_Fijos.md` §2.1 / commit `957d2c8` | 24/05 |
| 2 | Guillermo Daza Alcalá | Matriz de paridad y estilo de despliegue híbrido local/AWS | DTI | `docs/DTI.md` §8.0 / commit `957d2c8` | 27/05 |
| 3 | Rita Nina | Historias de usuario INVEST y Matriz de Priorización RICE | PRD | `docs/PRD_Activos_Fijos.md` §5.0 / commit `957d2c8` | 24/05 |
| 4 | Guillermo Daza Alcalá | Creación del ADR 0005 de infraestructura híbrida | ADR | `docs/adr/0005-cloud-provider-y-estilo-de-despliegue.md` | 27/05 |
| 5 | Josefina Rojas | Diagramas Mermaid de Contexto y Contenedores C4 | Diagrama | `docs/diagrams/c4_context.mmd` y `c4_container.mmd` | 27/05 |
| 6 | Rita Nina | Diagrama de máquina de estados del ciclo de vida del activo | Diagrama | `docs/diagrams/state_diagram_activo.mmd` | 27/05 |
| 7 | Guillermo Daza Alcalá | Código e informe de la POC-01: Reconciliación de Sincronización | POC | `pocs/POC-01-sync/` (código + readme) | 27/05 |
| 8 | Josefina Rojas | Código e informe de la POC-02: Generador de Actas SABS | POC | `pocs/POC-02-pdf/` (código + readme) | 27/05 |
| 9 | Rita Nina | Prompt de ingeniería para generación de endpoint REST QR | Prompt | `prompts/PR-UC-001.md` | 27/05 |
| 10 | Guillermo Daza Alcalá | Prompt de ingeniería para el motor del Sync Engine | Prompt | `prompts/PR-UC-002.md` | 27/05 |
| 11 | Josefina Rojas | Eliminación de placeholders en BRD y KPIs de negocio | BRD | `docs/BRD_Activos_Fijos.md` §8.0 / commit `957d2c8` | 27/05 |
| 12 | Rita Nina | Eliminación de placeholders en PRD y Roadmap de entregas | PRD | `docs/PRD_Activos_Fijos.md` §3.3 / commit `957d2c8` | 27/05 |
| 13 | Guillermo Daza Alcalá | Diagrama UML del modelo de dominio de clases de activos | Diagrama | `docs/diagrams/domain_model_class.mmd` | 27/05 |
| 14 | Josefina Rojas | Diagramas de componentes C4 de sincronización y data flow | Diagrama | `docs/diagrams/c4_components_sync.mmd` y `data_flow_sync.mmd` | 27/05 |
| 15 | Rita Nina | User Journeys de Josefina y Guillermo en inventario y localización | Diagrama | `docs/diagrams/journey_realizar_inventario.mmd` y `journey_localizar_activo.mmd` | 27/05 |

---

## 2. Resumen por integrante

| Integrante | Total de tareas | Categorías cubiertas (#) | Observación |
| :---- | :---- | :---- | :---- |
| Guillermo Daza Alcalá | 5 | 5 (DTI, ADR, POC, Prompt, Diagrama) | Lideró la arquitectura de paridad y código de POC-01 |
| Josefina Rojas | 5 | 4 (FSD, Diagrama, POC, BRD) | Lideró los diagramas C4 y el desarrollo de la POC-02 |
| Rita Nina | 5 | 3 (PRD, Diagrama, Prompt) | Lideró las historias de usuario y prompt del endpoint QR |
| **Total grupo** | **15** | — | — |

---

## 3. Cálculo del factor de aporte individual

*   `aporte_promedio_grupo` = 15 / 3 = 5 tareas/persona.
*   `factor_i` = clamp(tareas_i / 5, 0.5, 1.1)

### Aplicación

| Integrante | Tareas | Factor sin clamp | Factor final (clamp 0.5–1.1) | Nota individual (Nota_grupal × factor) |
| :---- | :---- | :---- | :---- | :---- |
| Guillermo Daza Alcalá | 5 | 5 / 5 = 1.00 | **1.10** (Aporte Sobresaliente) | Nota_grupal × 1.10 (max +10%) |
| Josefina Rojas | 5 | 5 / 5 = 1.00 | **1.10** (Aporte Sobresaliente) | Nota_grupal × 1.10 (max +10%) |
| Rita Nina | 5 | 5 / 5 = 1.00 | **1.10** (Aporte Sobresaliente) | Nota_grupal × 1.10 (max +10%) |

**Aporte promedio del grupo**: 5.0 tareas/persona. 
*(El grupo ha trabajado de manera totalmente balanceada y cooperativa en este release final).*

---

## 4. Reglas del grupo sobre qué cuenta como tarea

El grupo se acoge a las directrices de granularidad recomendadas por la cátedra:
*   Un diagrama Mermaid (`.mmd`) individual versionado cuenta como 1 tarea.
*   Una POC codificada y ejecutada con reporte de métricas en carpeta cuenta como 1 tarea.
*   Un prompt estructurado de IA en carpeta `prompts/` cuenta como 1 tarea.
*   La limpieza total de placeholders y finalización de un documento base cuenta como 1 tarea.

---

## 5. Auditoría del docente (opcional)

*Espacio reservado para observaciones del revisor de la cátedra.*

---

## 6. Checklist de cierre del release

*   [x] §0 Metadatos completos con branch del release y HEAD de commit.
*   [x] §1 Tareas atribuidas con granularidad consistente y enlaces reales.
*   [x] §2 Resumen totalizado coincidente con el aporte del grupo.
*   [x] §3 Cálculo de factores individuales balanceados de forma cooperativa.
*   [x] Archivo commiteado en la rama de lanzamiento `release/2.0.0` antes de la defensa.
