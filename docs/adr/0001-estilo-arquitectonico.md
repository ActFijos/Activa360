# ADR 0001: Estilo Arquitectónico y Estrategia de Migración de FTGO

* **ID:** ADR-0001
* **Título:** Selección del Estilo Arquitectónico y Estrategia de Migración para la plataforma FTGO
* **Status:** Accepted
* **Fecha:** 2026-05-20
* **Autor:** Equipo de Arquitectura FTGO

---

## 1. Contexto

La plataforma FTGO opera actualmente como una aplicación monolítica empaquetada como un archivo Java WAR. Con el incremento en el volumen de transacciones y el tamaño del equipo de desarrollo, el monolito se ha convertido en un obstáculo operativo ("infierno monolítico", Richardson Cap 1). 

Los pipelines de integración continua tardan horas en compilar, el escalamiento de componentes críticos (como el rastreo en tiempo real) obliga a sobredimensionar toda la infraestructura, y un fallo en una librería de notificaciones puede derribar por completo el sistema de facturación y toma de pedidos. Además, el acoplamiento tecnológico bloquea la innovación con nuevos lenguajes y frameworks eficientes.

Para sostener el crecimiento proyectado en el brief (picos de tráfico de 5x y latencia < 200 ms p95 en la interfaz del consumidor), se requiere cambiar el estilo arquitectónico hacia un modelo que permita escalabilidad independiente, modularidad robusta y autonomía para los equipos de desarrollo.

---

## 2. Opciones Consideradas

Se evaluaron tres alternativas estratégicas para abordar el rediseño de la infraestructura de FTGO:

### Opción 1: Mantener y Optimizar el Monolito Existente (Monolito Modular)
* **Descripción:** Mantener la aplicación empaquetada como un único WAR, pero refactorizar internamente el código para agruparlo en módulos lógicos estrictamente definidos mediante fronteras claras en el código Java (DDD y encapsulamiento estricto a nivel de paquetes de Maven).
* **Pros:**
  * Complejidad operativa muy baja; no requiere orquestadores distribuidos de red, balanceadores complejos ni distributed tracing.
  * Consistencia de datos transaccional nativa muy simple (ACID de base de datos relacional única).
* **Contras:**
  * No resuelve el problema del escalado independiente de recursos físicos (NFR-01 Carga). Para escalar el rastreo GPS, se debe duplicar el monolito WAR completo.
  * Lock-in tecnológico persistente; todo el equipo sigue encadenado a la versión de Java/Spring heredada del WAR.
  * Los tiempos de compilación y despliegue en el CI/CD seguirán creciendo a medida que se agreguen características.

### Opción 2: Reescritura Completa y Rediseño Masivo ("Big-Bang Migration")
* **Descripción:** Diseñar y construir el nuevo ecosistema completo de microservicios (las 7 capacidades del Capítulo 2) de forma paralela desde cero y apagar el monolito legacy por completo el día del lanzamiento del nuevo sistema.
* **Pros:**
  * Permite diseñar una arquitectura ideal limpia sin lidiar con el acoplamiento técnico ni con integraciones heredadas.
  * No requiere crear adaptadores ni código puente de sincronización temporal entre el sistema nuevo y el viejo.
* **Contras:**
  * Riesgo extremadamente alto de fracaso del proyecto; las migraciones Big-Bang en plataformas con operaciones activas 24/7 suelen retrasarse meses o fallar al no replicar el 100% de la lógica legacy oculta.
  * Retorno de inversión (ROI) a muy largo plazo; el negocio no recibe valor funcional de la nueva arquitectura hasta que todo el sistema esté completado y desplegado (estimado en 18-24 meses).
  * Viola la directiva de tolerancia a fallos y resiliencia del negocio del brief.

### Opción 3: Migración Incremental Basada en Patrón Strangler Fig (Higo Estrangulador)
* **Descripción:** Migrar gradualmente el monolito a microservicios. Se implementa un API Gateway centralizado para ruteo. Las nuevas características se desarrollan como microservicios independientes, y las capacidades del monolito se extraen una a una de forma incremental (iniciando por Order Taking y Billing en la Fase 1) sustituyendo las llamadas viejas por redirecciones de red.
* **Pros:**
  * **Valor Temprano y Bajo Riesgo:** Permite desplegar microservicios individuales a producción en semanas, mitigando riesgos operativos y aportando valor incremental al negocio.
  * **Escalabilidad Selectiva Rápida:** Los componentes más críticos y saturados de tráfico (toma de pedidos y facturación) se extraen primero y se escalan de forma independiente (NFR-01).
  * Coexistencia segura; el monolito legacy WAR sigue corriendo de fondo gestionando las capacidades no migradas (como Delivery).
* **Contras:**
  * Exige desarrollar y mantener código puente temporal (adaptadores, colas de sincronización) para mantener consistentes los datos entre los microservicios y la base de datos del monolito.
  * Complejidad inicial de red media-alta debido a la coexistencia de llamadas internas y externas durante el periodo de transición de 18-24 meses.

---

## 3. Decisión

Se decide adoptar la **Opción 3: Migración Incremental Basada en Patrón Strangler Fig (Higo Estrangulador)** para la transición de la arquitectura de FTGO.

### Justificación
Esta estrategia responde directamente al **NFR-05 (Coexistencia y Migración)** y a la necesidad de mantener el negocio operando con un Uptime del **99.9% (NFR-03)**. No podemos permitirnos el riesgo de una migración Big-Bang en un marketplace activo 24/7. 

La extracción prioritaria de `Order Taking` y `Billing & Accounting` en la Fase 1 nos permitirá aislar el flujo crítico de ingresos en microservicios ligeros con escalabilidad horizontal robusta, resolviendo las caídas por picos de tráfico de **5x (NFR-01)** y garantizando un tiempo de respuesta **< 200 ms p95 (NFR-02)** al desacoplarse del pesado monolito.

---

## 4. Consecuencias

### Consecuencias Positivas (Beneficios)
* **Despliegues Autónomos:** Los equipos de desarrollo de Order Taking pueden compilar, testear y desplegar cambios a producción de forma diaria sin depender de la compilación o despliegue del resto del monolito.
* **Aislamiento de Fallas Operativo:** Si el módulo de notificaciones o tracking GPS del monolito falla, el microservicio de toma de pedidos seguirá operando de forma independiente, salvaguardando las transacciones activas.
* **Flexibilidad Tecnológica:** Los nuevos microservicios satélite pueden ser desarrollados en tecnologías más eficientes en consumo de memoria o procesamiento que el core en Spring Boot, según sea conveniente.

### Consecuencias Negativas (Trade-offs / Costos)
* **Complejidad Operativa Incrementada:** Se requiere desplegar y mantener un API Gateway, proxies de red, y configurar una infraestructura de observabilidad distribuida (Correlation IDs y tracing distribuido) desde la Fase 1.
* **Costo de Sincronización Temporal:** Es obligatorio implementar mecanismos de sincronización de datos (ej. mediante eventos asíncronos) para mantener la coherencia de datos de catálogos y perfiles de usuario que coexisten temporalmente entre los microservicios extraídos y el monolito WAR heredado.
* **Overhead de Red:** Las llamadas inter-servicio añaden una latencia de red que debe ser mitigada mediante comunicación asíncrona o gRPC eficiente para no comprometer el NFR-02 (< 200 ms).
