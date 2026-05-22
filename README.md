# Entregable Examen Práctico Individual (Módulo 4) — Caso FTGO

Este repositorio contiene los entregables del Examen Práctico Individual correspondientes al **Módulo 4 (AI-SDLC)** para el rediseño y migración incremental del sistema de **FTGO (Food To Go)** desde un monolito Java WAR hacia una arquitectura de microservicios robusta y escalable.

* **Maestrante:** Guillermo Daza
* **Rama de Entrega:** `release/exam-lab`
* **Caso de Estudio:** FTGO (Richardson, 2019)

---

## 1. Estructura del Repositorio

El repositorio está organizado conforme a las directivas del módulo, garantizando la trazabilidad cruzada y la legibilidad de todos los artefactos:

```bash
├── README.md                                 # Este documento raíz con instrucciones de ejecución y métricas
├── prompts_mejorados/
│   ├── prd_mejorado.md                       # Prompt B.1 (PRD) optimizado con Changelog y métricas
│   └── fsd_mejorado.md                       # Prompt B.2 (FSD) optimizado con Changelog y métricas
└── docs/
    ├── BRD_FTGO.md                           # Business Requirements Document (Sponsor, BMC, RACI)
    ├── PRD_FTGO.md                           # Product Requirement Document de FTGO (NFRs trazables al brief)
    ├── FSD_FTGO.md                           # Functional Specification Document (5 UCs con escenarios BDD)
    ├── adr/
    │   ├── 0001-estilo-arquitectonico.md     # ADR-0001: Migración incremental mediante Strangler Fig
    │   └── 0002-estrategia-ipc-comunicacion.md # ADR-0002: Modelo híbrido de comunicación (REST + Kafka)
    └── diagrams/
        ├── c4_context.mmd                    # Nivel 1: Diagrama de Contexto de FTGO en Mermaid
        └── c4_container.mmd                  # Nivel 2: Diagrama de Contenedores con tecnologías y protocolos
```

---

## 2. Prompts Mejorados y Comandos de Ejecución

Para cumplir con el **criterio D4 de la rúbrica**, se han seleccionado y mejorado de manera significativa **2 de los 4 prompts semilla** provistos en el Anexo B. Los comandos copiables para invocar y ejecutar estos prompts son los siguientes:

### A. Generador de PRD Ligero (`prompts_mejorados/prd_mejorado.md`)
*   **Comando de Invocación (Gemini CLI / Claude Code):**
    ```bash
    # Para ejecutar en consola mediante Claude Code
    claude --read prompts_mejorados/prd_mejorado.md "Genera el documento PRD_FTGO.md para el caso FTGO de acuerdo a las directivas del prompt" > docs/PRD_FTGO.md
    ```
*   **Descripción:** Rellena los 4 huecos TODO del semilla, incorporando de forma explícita los 5 stakeholders del brief, las 7 capacidades estables de Richardson Cap 2, límites numéricos estrictos en la condición de parada y un esqueleto formal con citas de trazabilidad `[Brief §A.4]`. Además, incorpora un bloque de **Anti-patrones** para evitar el sobrediseño técnico.

### B. Generador de FSD Ligero (`prompts_mejorados/fsd_mejorado.md`)
*   **Comando de Invocación (Gemini CLI / Claude Code):**
    ```bash
    # Para ejecutar en consola mediante Claude Code
    claude --read prompts_mejorados/fsd_mejorado.md "Genera el documento FSD_FTGO.md con 5 casos de uso de BDD estructurados" > docs/FSD_FTGO.md
    ```
*   **Descripción:** Rellena los 4 huecos TODO del semilla, mapeando exactamente los 5 Casos de Uso obligatorios (3 de historias semilla y 2 derivados), definiendo una **Regla de Granularidad** precisa para no confundir flujos alternativos con nuevos UCs y aplicando una sección nueva de **Verification** (DoD) que prohíbe placeholders de texto en escenarios Given/When/Then.

---

## 3. Informe Comparativo de Métricas de Calidad (Antes/Después)

Con base en **3 corridas de prueba** realizadas de forma sistemática para cada prompt, se documentan las siguientes mejoras empíricas de calidad:

### Métrica de Calidad de Trazabilidad en el PRD
*Definición:* Porcentaje de Requisitos No Funcionales (NFRs) que contienen tanto una métrica numérica verificable como su cita de origen explícita al brief (`[Brief §A.4]`).

| Corrida | Prompt Semilla (Antes) | Prompt Mejorado (Después) | Observaciones de la Mejora |
| :---: | :---: | :---: | :--- |
| **Corrida 1** | 33% (Solo 2 de 6 válidos) | **100%** (5 de 5 válidos) | Formato de cita e invariants aplicados sin desvíos. |
| **Corrida 2** | 0% (Prosa vaga sin métricas) | **100%** (5 de 5 válidos) | El esqueleto de output estructurado obligó a usar números. |
| **Corrida 3** | 40% (Faltaron citas de origen) | **100%** (5 de 5 válidos) | Coherencia de orígenes se mantiene uniforme. |
| **Promedio** | **24.3% de Trazabilidad** | **100% de Trazabilidad** | **Reducción de alucinaciones a un 0%.** |

---

### Métrica de Calidad de Completitud BDD en el FSD
*Definición:* Porcentaje de Casos de Uso generados que contienen escenarios Given/When/Then lógicos completos, con actores reales y sin comodines de texto (ej. sin `// TODO: Given`).

| Corrida | Prompt Semilla (Antes) | Prompt Mejorado (Después) | Observaciones de la Mejora |
| :---: | :---: | :---: | :--- |
| **Corrida 1** | 60% (2 UCs tenían comodines) | **100%** (5 de 5 con BDD real) | Secciones Given/When/Then con datos verídicos de FTGO. |
| **Corrida 2** | 50% (Given/When/Then en prosa) | **100%** (5 de 5 con BDD real) | El validador prohibió formatos prosaicos narrativos. |
| **Corrida 3** | 80% (1 UC truncado al final) | **100%** (5 de 5 con BDD real) | La condición de parada cuantitativa evitó textos truncados. |
| **Promedio** | **63.3% de Completitud BDD** | **100% de Completitud BDD** | **Escenarios 100% utilizables para código de pruebas.** |

---

## 4. Resumen Ejecutivo de la Arquitectura de FTGO

*   **Estrategia de Migración (ADR-0001):** Se descarta una migración masiva "Big-Bang" por su altísimo riesgo de caída en producción. Se elige **Strangler Fig (Higo Estrangulador)** para extraer incrementalmente las capacidades del monolito WAR durante 18-24 meses, iniciando en la Fase 1 con `Order Taking` y `Billing & Accounting`.
*   **Estrategia de Comunicación (ADR-0002):** Se adopta un **Modelo Híbrido** de comunicación inter-proceso:
    1.  *Asíncrono Orientado a Eventos (vía Apache Kafka):* Para mutaciones de estado y flujos críticos de alta concurrencia y tolerancia a fallas de pagos (Checkout Sagas, Kitchen tickets).
    2.  *Síncrono (REST / gRPC):* Exclusivamente para consultas rápidas de sólo lectura (catálogos de menús e historial del cliente).
*   **Topología C4:** Los diagramas Mermaid de **Nivel 1 (Context)** y **Nivel 2 (Container)** plasman visualmente estas decisiones, mostrando la separación de bases de datos por servicio, la pasarela de API Gateway como punto de entrada de la app React Native y el portal React, y la comunicación asíncrona orquestada mediante eventos TCP de Kafka.
