# Guión Estratégico y Respuestas Rápidas para la Defensa Final – Activa360

Este documento es un "acordeón" (cheat-sheet) de respuestas rápidas y estrategias de comunicación diseñado para apoyar a **Josefina Rojas**, **Rita Nina** y **Guillermo Daza Alcalá** durante la exposición y la ronda de preguntas (Q&A) ante el tribunal evaluador.

---

## 1. El Pitch de 3 Minutos (Apertura de la Defensa)

*   **El Problema (Rita)**: "En instituciones públicas grandes como la UMSS, la gestión de activos fijos es lenta, manual y propensa a pérdidas. Los inventarios tardan meses, se generan 'activos fantasmas' y las bajas no cumplen estrictamente con la normativa SABS (D.S. 0181), lo que genera observaciones de auditoría del Estado."
*   **La Solución (Josefina)**: "Diseñamos **Activa360**, un sistema inteligente GovTech estructurado desde el MRD y el PRD para solucionar tres necesidades críticas: escaneo ultra-rápido de activos con códigos QR, sincronización offline resiliente para zonas sin cobertura de red en los campus de la universidad, y emisión automatizada de actas de baja conformes a la ley."
*   **La Arquitectura (Guillermo)**: "Para soportar este negocio robusto, implementamos una **Arquitectura Hexagonal en NestJS** que desacopla la lógica de negocio de la infraestructura, una estrategia orientada a eventos para la sincronización y un esquema de **Infraestructura Híbrida** que garantiza soberanía de datos locales pero con paridad en la nube AWS para alta disponibilidad."

---

## 2. Respuestas Blindadas a Preguntas del Tribunal (Q&A)

### Pregunta 1: ¿Por qué implementaron Arquitectura Hexagonal y no MVC clásico?
*   **Respuesta Clave (Guillermo/Josefina)**: 
    *   "MVC clásico tiende a acoplar la base de datos a la lógica de negocio, creando código difícil de probar y migrar."
    *   "Con la **Arquitectura Hexagonal (puertos y adaptadores)**, nuestra lógica de dominio (Core) es 100% independiente de NestJS, de TypeORM y de PostgreSQL. Si el día de mañana la UMSS decide migrar de Postgres a Oracle o cambiar la API REST por GraphQL, solo modificamos los *Adaptadores de Salida/Entrada*, dejando el núcleo intacto y garantizando que las pruebas unitarias pasen sin cambios."

### Pregunta 2: Si el sistema debe ser On-Premise (UMSS), ¿por qué mapearon AWS?
*   **Respuesta Clave (Guillermo)**: 
    *   "El Decreto Supremo N° 0181 y las políticas de la UMSS exigen soberanía de datos *On-Premise* dentro de sus servidores locales."
    *   "Sin embargo, bajo el **ADR 0005**, diseñamos una arquitectura basada en **paridad Cloud-Native (Docker/Kubernetes local)** que mapea uno a uno con servicios en AWS (ej. clústeres locales ECS Fargate, MinIO local a S3, y Keycloak local a Cognito). Esto garantiza que si la UMSS decide migrar a una infraestructura gubernamental nacional en la nube, el cambio de despliegue requiere **cero modificaciones de código**."

### Pregunta 3: ¿Cómo manejan los conflictos si dos personas modifican el mismo activo offline?
*   **Respuesta Clave (Josefina/Rita)**:
    *   "Implementamos el algoritmo **Última Escritura Gana (Last-Write-Wins)** basado en invariantes de auditoría central."
    *   "El Sync Engine compara el timestamp del payload enviado por la App Móvil contra el timestamp del registro central en PostgreSQL. Si el registro central es más reciente (porque otro usuario sincronizó antes), la versión de base de datos Postgres se conserva intacta, evitando race-conditions y protegiendo la integridad de la auditoría."

---

## 3. Comandos Rápidos para Demostración en Vivo (Demos)

Si el tribunal les pide probar o explicar los flujos funcionales del backend en consola, abran la terminal e identifiquen las dos POCs:

### Demo 1: Simulación de Sincronización Masiva (POC-01)
*   **Qué hace**: Procesa un lote masivo de 1,000 escaneos móviles con 5% de conflictos concurrentes e inyección atómica SQL.
*   **Comando a ejecutar**:
    ```bash
    node pocs/POC-01-sync/test_sync.js
    ```
*   **Qué destacar al docente**: "La reconciliación y validación transaccional de 1,000 registros toma apenas **0.3 milisegundos de CPU**, cumpliendo con la meta de ser inferior a 5 segundos."

### Demo 2: Generación de Acta de Baja SABS (POC-02)
*   **Qué hace**: Valida el cumplimiento del Decreto Supremo N° 0181, compila los campos legales (firmas duales custodio/MAE) y calcula el hash de inmutabilidad digital.
*   **Comando a ejecutar**:
    ```bash
    node pocs/POC-02-pdf/generate_sabs_acta.js
    ```
*   **Qué destacar al docente**: "El sistema valida que ningún campo exigido por la ley esté vacío, genera la estructura oficial de impresión y emite un hash criptográfico único SHA-256 en **1.0 milisegundo**, garantizando auditorías públicas seguras."

---

## 4. Checklist Técnico de Coherencia (Para recordar antes de entrar)

Para asegurar la fluidez mental durante la exposición, recuerden que todas nuestras decisiones se justifican con trazabilidad:
*   **El MRD** detectó que el tiempo de búsqueda física del activo es de **45 minutos** (Excel ineficiente).
*   **El BRD** definió la meta SMART de bajar ese tiempo a **< 1 minuto** usando códigos QR.
*   **El PRD** priorizó el caso de uso `PRD-UC-001` (Escanear QR) y `PRD-UC-002` (Sincronización).
*   **El FSD** definió los criterios de aceptación Gherkin y los contratos estrictos de software.
*   **El DTI** tradujo esto a código estructurado mediante NestJS transaccional y paridad en la nube.
