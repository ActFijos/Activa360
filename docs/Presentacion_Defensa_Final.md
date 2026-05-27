---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #0f172a
color: #e2e8f0
style: |
  section {
    font-family: 'Outfit', 'Inter', sans-serif;
  }
  h1 {
    color: #38bdf8;
  }
  h2 {
    color: #0ea5e9;
  }
  footer {
    color: #64748b;
  }
---

# ACTIVA360
### Sistema Inteligente y Resiliente de Gestión de Activos Fijos

**Defensa Final de Maestría – Módulo IV**
Universidad Mayor de San Simón (UMSS)

**Autores**:
*   Josefina Rojas
*   Rita Nina
*   Guillermo Daza Alcalá

**Fecha**: 27 de Mayo de 2026

---

## 1. El Diagnóstico del Negocio

### El Problema Tradicional (UMSS)
*   **Inconsistencia**: Coincidencia de inventario físico inicial de solo **68%** debido al uso de planillas Excel desarticuladas.
*   **Ineficiencia**: El personal tarda un promedio de **45 minutos** en localizar físicamente un activo tecnológico o de laboratorio.
*   **Riesgo Normativo**: Bajas de activos sin trazabilidad legal con el Decreto Supremo N° 0181 (SABS).

### La Oportunidad de Activa360
*   Optimizar los inventarios en zonas rurales mediante escaneo QR y almacenamiento offline resiliente.
*   Reducir el tiempo de localización a **menos de 1 minuto**.

---

## 2. Coherencia y Trazabilidad Documental

Garantizamos un desarrollo de software libre de discrepancias mediante trazabilidad total en cascada:

```
  [ MRD ]   --> Identifica Necesidad de Mercado (45 min búsqueda)
     |
  [ BRD ]   --> Define la Meta SMART de Negocio (< 1 min QR)
     |
  [ PRD ]   --> Traduce Metas a Requerimientos e Historias INVEST
     |
  [ FSD ]   --> Define Casos de Uso (FSD-UC) y Criterios Gherkin
     |
  [ DTI ]   --> Traduce a Patrones de Código Hexagonal NestJS
```

---

## 3. Calidad Arquitectónica: Núcleo Decoplado

*   **Arquitectura Hexagonal**: Aislamiento estricto de la lógica de negocio (Dominio) frente a dependencias externas (NestJS, Postgres, TypeORM).
*   **Puertos y Adaptadores**:
    *   *Adaptadores de Entrada*: Controladores REST y Handlers de eventos de escaneo QR.
    *   *Adaptadores de Salida*: Repositorios e interfaces de almacenamiento persistente.
*   **Beneficios**: Testeabilidad aislada al 100%, modularidad y facilidad de migración de bases de datos o frameworks.

---

## 4. Despliegue Híbrido y Paridad Cloud-Native (ADR 0005)

### El Trade-off Estratégico (UMSS/Normativa)
*   **Soberanía On-Premise**: Servidores físicos institucionales en la UMSS para cumplimiento regulatorio estricto.
*   **Escalabilidad Cloud (AWS)**: Paridad arquitectónica para migración transparente.

| Capa / Servicio | Infraestructura UMSS (On-Prem) | Infraestructura Cloud (AWS) |
| :--- | :--- | :--- |
| **Orquestador** | Kubernetes Local (K3s / OKD) | Amazon ECS / AWS Fargate |
| **Base de Datos**| PostgreSQL local (HA Cluster) | Amazon RDS PostgreSQL |
| **Objetos** | Servidor MinIO (S3 compatible) | Amazon S3 |
| **Seguridad** | Clúster Keycloak local | Amazon Cognito |

---

## 5. Gobernanza del Desarrollo con IA (AGENTS.md)

*   **Topología de Agentes**: Declaración explícita de herramientas de IA autorizadas en el repositorio (`cursor-coder`, `dti-author`).
*   **Guardrails Activos**:
    *   Prohibido generar sentencias SQL crudas o modificaciones directas sin *review* humano (HIL).
    *   Obligatoriedad de validar contratos Gherkin y arquitectura hexagonal.
*   **Prompt Mapping**: Prompts estructurados e invariantes versionados físicamente en la carpeta `prompts/` (`PR-UC-001.md` al `PR-UC-002.md`).

---

## 6. Validación Científica: POC-01 (Offline Sync)

*   **Hipótesis**: Reconciliación atómica y resolución de conflictos basados en timestamps en menos de 5 segundos para 1,000 registros offline.
*   **Metodología**: Simulación en Node.js (`test_sync.js`) ejecutando batch de sincronización con 5% de conflictos concurrentes.

### Métricas de Rendimiento Obtenidas:
*   **Tiempo de procesamiento CPU**: **0.30 ms** (Meta < 5,000 ms).
*   **Atomicidad**: 100% transaccional (Consistencia Postgres / Rollback en falla).
*   **Tasa de Éxito**: 95.0% aplicados limpia; 5.0% conflictos resueltos exitosamente conservando el timestamp de la DB principal.

---

## 7. Validación Científica: POC-02 (PDF Acta SABS)

*   **Hipótesis**: Generación automatizada de reportes SABS cumpliendo con el D.S. N° 0181 en menos de 5 segundos con inmutabilidad.
*   **Metodología**: Compilación de campos en Node.js (`generate_sabs_acta.js`), validación de firmas duales y hashing de seguridad.

### Métricas de Rendimiento Obtenidas:
*   **Tiempo de generación**: **1.01 ms** (Meta < 5,000 ms).
*   **Conformidad Legal**: **100% de cumplimiento** (código SABS, QR, firmas de Custodio y MAE/Autorizador).
*   **Inmutabilidad**: Generación del hash criptográfico SHA-256 único de auditoría registrado en base de datos.

---

## 8. Aportes Individuales (Release 2.0.0)

Distribución equilibrada de tareas para maximizar el factor de desempeño grupal (**Aporte Sobresaliente - 1.10** para todos):

*   **Guillermo Daza Alcalá**:
    *   Diseño de Paridad AWS en DTI y ADR 0005.
    *   Implementación y ejecución del Sync Engine (POC-01) y Prompt PR-UC-002.
*   **Josefina Rojas**:
    *   Especificación FSD-UC y diagramas Mermaid C4.
    *   Desarrollo de la generación de Actas SABS (POC-02) y bitácora del BRD.
*   **Rita Nina**:
    *   Matriz de priorización PRD y Roadmap de transición.
    *   User Journeys de inventario/localización y Prompt PR-UC-001.

---

## 9. Hoja de Ruta hacia el Siguiente Módulo

```
  [ Hito 1: SIGEP/VSIAF ]  --> Integración contable nacional SOAP/REST (Q3 2026)
           |
  [ Hito 2: HA K8s UMSS ]  --> Alta disponibilidad y clúster local (Q4 2026)
           |
  [ Hito 3: IA Predictiva ]--> Alarmas predictivas de vida útil (Q1 2027)
```

*   **Métrica de Éxito**: Reducción del **35%** en costes de sustitución de emergencia de activos tecnológicos y de laboratorio de la universidad.

---

# ¡Muchas Gracias!
### ¿Preguntas del Honorable Tribunal?

**Activa360 – Gestión Inteligente de Activos Fijos**
*Soberanía On-Premise, Visión Cloud-Native e Integración Resiliente*

*   **Rama de Entrega**: `release/2.0.0`
*   **Autores**: Josefina Rojas, Rita Nina, Guillermo Daza Alcalá
