# Business Requirements Document (BRD) – FTGO (Food To Go)

**Propósito del BRD**: Formalizar las **necesidades y restricciones de negocio** que justifican el rediseño y la migración incremental de la plataforma FTGO desde un monolito legacy Java WAR hacia una arquitectura de microservicios. Responde a **"¿qué necesita el negocio y por qué?"**.

---

## 0. Metadatos

| Campo | Valor |
| :---- | :---- |
| Producto | FTGO – Marketplace Inteligente de Entrega de Comida a Domicilio |
| Grupo | Grupo Activa360 ( Guillermo Daza ) |
| Versión | v0.1 |
| Fecha | 20/05/2026 |
| Sponsor de negocio | Lic. Armando Ríos (Máxima Autoridad Ejecutiva - MAE FTGO) |
| Stakeholders | Consumidores, Restaurantes Socios, Couriers (Repartidores), Empleados de Soporte FTGO, Entidades Reguladoras de Pagos |
| Autores | Guillermo Daza |
| Revisores | Docente + 1 grupo par |
| Estado | Listo para revisión |
| Insumo de Referencia | Anexo A: Brief de FTGO & Capítulos 1-3 de Microservices Patterns |
| Prompts utilizados | Prompts de refinamiento de negocio S02 |

---

## 1. Resumen Ejecutivo

FTGO es una plataforma consolidada de marketplace de comida a domicilio que conecta a tres actores fundamentales: Consumidores, Restaurantes y Couriers independientes. Actualmente, la plataforma opera sobre una infraestructura monolítica Java empaquetada como un archivo WAR, la cual ha alcanzado un estado crítico de deuda técnica conocido como **"infierno monolítico"**. 

Las limitaciones físicas de esta arquitectura bloquean el crecimiento comercial de la empresa:
1. **Pérdida de Transacciones en Horas Pico:** El sistema colapsa durante los horarios de almuerzo y cena (cargas de hasta 5x), perdiendo ventas inmediatas.
2. **Latencia Inaceptable:** Los tiempos de búsqueda y checkout superan los 2 segundos, provocando un 30% de abandono de carritos.
3. **Falta de Tolerancia a Fallos:** Si la pasarela de pagos externa (Stripe) sufre una degradación menor, todo el flujo de toma de pedidos se cae de forma síncrona.

Este BRD justifica la necesidad de negocio de migrar de forma incremental hacia una **arquitectura distribuida de microservicios** mediante el patrón **Strangler Fig**. 

**Métricas Clave de Éxito:**
*   % de Coincidencia de disponibilidad de ingredientes en cocina vs sistema (Meta: ≥ 98%).
*   Reducción en la latencia de respuesta en Checkout a < 200 ms p95 (NFR-02).
*   Garantizar un Uptime del 99.9% para la creación de pedidos (NFR-03).

---

## 2. Contexto del Negocio

*   **Organización:** FTGO Inc.
*   **Unidades Impactadas:** Operaciones de Marketplace, Relaciones con Restaurantes, Logística de Entrega (Delivery) y Finanzas.
*   **Procesos de Negocio Afectados:** Toma de pedidos en línea, cobro y facturación, preparación de comida en cocina, despacho y tracking de couriers en tiempo real.
*   **Estrategia de la Organización:** Modernización tecnológica y escalamiento comercial para duplicar la cuota de mercado en los próximos 18 meses mediante un servicio de altísima disponibilidad y baja latencia.

---

## 3. Problema y Oportunidad de Negocio

### 3.1 El Problema
El sistema actual es ineficiente y no escala debido a las siguientes deficiencias del monolito WAR:
*   **Desconexión de Inventario Físico (Cocina) vs App:** Los menús en la app no se actualizan en tiempo real con el stock de ingredientes en cocina, generando cancelaciones manuales frustrantes para el consumidor.
*   **Latencias Críticas de Checkout:** Las llamadas en cascada síncronas bloquean los hilos del servidor web, elevando la latencia a más de 1.5 segundos en horas pico.
*   **Acoplamiento de Fallas de Terceros:** La pasarela de pagos Stripe y el API de Google Maps están integrados de forma síncrona en el hilo principal; cualquier caída externa congela toda la plataforma.

### 3.2 La Oportunidad
*   **Valor Económico Estimado:** Reducir las cancelaciones de pedidos por fallos de red en un **95%**, recuperando un estimado de **Bs. 140,000** anuales en comisiones perdidas.
*   **Valor Estratégico:** Posicionarse como el marketplace de entrega de comida más rápido y confiable del mercado nacional, atrayendo a restaurantes premium insatisfechos con competidores lentos.

---

## 4. Usuarios Objetivo / Personas Clave

### 4.1 Persona Principal: Roger Valenzuela (Jefe de Operaciones de FTGO)
*   **Contexto:** Responsable de garantizar que el flujo de pedidos ocurra sin fricciones y que los SLAs de entrega se cumplan a nivel nacional.
*   **Jobs-to-be-Done:** Monitorear el volumen de transacciones por minuto, asegurar que los restaurantes acepten tickets a tiempo y resolver disputas de cobro.
*   **Dolores Principales:** Recibe quejas masivas de clientes cuando la app colapsa un viernes por la noche; no tiene herramientas para rastrear dónde falló la transacción en el monolito.
*   **Ganancia Esperada:** Un panel de control en tiempo real con observabilidad absoluta y alta estabilidad del sistema.

### 4.2 Persona Secundaria: Sandra Salazar (Operadora de Cocina del Restaurante)
*   **Contexto:** Encargada de recibir los pedidos de FTGO en la tableta de la cocina y preparar la comida según el orden de llegada.
*   **Jobs-to-be-Done:** Visualizar tickets de pedidos vigentes, estimar tiempos de preparación y marcar platos como "fuera de stock" al instante.
*   **Dolores Principales:** La consola se congela en horas pico, obligando a re-transcribir tickets en papel; los clientes ordenan platos cuyos ingredientes se agotaron hace horas.
*   **Ganancia Esperada:** Una pantalla de cocina ultrarrápida, interactiva y con sincronización automática de stock de ingredientes.

---

## 5. Propuesta de Valor

| Eje | Contenido |
| :---- | :---- |
| **Para quién** | Consumidores, restaurantes socios y couriers que demandan una experiencia de delivery confiable y fluida. |
| **Qué necesita** | Procesar pedidos de comida de forma instantánea, con información real de stock en cocina y tracking en tiempo real. |
| **Nuestra propuesta es** | FTGO Platform – Una arquitectura moderna de microservicios con sincronización asíncrona orientada a eventos vía Kafka. |
| **Qué le aporta** | • Cero pérdida de pedidos ante picos de carga de 5x.<br>• Checkout ultra rápido (< 200 ms).<br>• Resiliencia total ante caídas temporales de Stripe o Maps mediante reintentos automáticos.<br>• Sincronización transparente de inventario de cocina en tiempo real. |
| **A diferencia de** | La aplicación monolítica WAR actual que colapsa ante alta concurrencia y acopla fallas en cascada. |
| **Nuestro diferencial** | Arquitectura híbrida (REST síncrono para lecturas de menús y Sagas asíncronas para mutaciones transaccionales). |

---

## 6. Panorama Competitivo

| Competidor / alternativa | Tipo | Fortaleza percibida | Debilidad percibida |
| :---- | :---- | :---- | :---- |
| Monolito Legacy WAR | Do-nothing | Ya está en producción, lógica de negocio centralizada | No escala, lento, acopla fallas, builds lentos |
| Competidores Nacionales | Directo | Gran base de usuarios, branding establecido | Interfaces lentas en horas pico, soporte local deficiente |
| Hojas de Cálculo / Teléfono | Indirecto | Costo cero, simplicidad absoluta | Cero trazabilidad, propenso a errores, ineficiente |
| **FTGO Target Platform** | **Directo** | **Baja latencia (<200ms), tolerancia a fallos, escalabilidad horizontal** | **Complejidad operativa inicial distribuida** |

---

## 7. Business Model Canvas

| Bloque | Mínimo 3 elementos concretos |
| :---- | :---- |
| **1. Segmentos de clientes** | Consumidores de comida / Restaurantes locales / Couriers independientes |
| **2. Propuesta de valor** | Conectividad y despacho en < 200ms / Tolerancia a fallos de pagos / Tracking en tiempo real |
| **3. Canales** | Aplicación móvil (iOS/Android) / Portal Web de Restaurantes / API Gateway centralizado |
| **4. Relación con clientes** | Notificaciones Push automatizadas / Soporte 24/7 de disputas / Liquidación transparente |
| **5. Fuentes de ingresos** | Comisión por pedido (20% al restaurante) / Tarifa de entrega al consumidor / Suscripciones premium |
| **6. Recursos clave** | Apache Kafka Broker / Microservicios en Java / Infraestructura de Nube Escalable |
| **7. Actividades clave** | Procesar checkout asíncrono / Optimizar rutas de delivery / Monitorear logs distribuidos |
| **8. Socios clave** | Pasarela Stripe / API Google Maps / Proveedores de hosting en la nube |
| **9. Estructura de costos** | Servidores cloud / Consumo de APIs (Maps) / Mantenimiento del Event Broker / Equipo dev |

---

## 8. Métricas Clave de Éxito (North Star + Apoyo)

| ID | KPI | North Star? | Línea base | Meta | Horizonte | Fuente del dato |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **KPI-01** | % de Pedidos Procesados y Entregados con Éxito | Sí | 90% | ≥ 99% | Q4 2026 | Logs de Kafka |
| **KPI-02** | Latencia en el checkout de compra (p95) | No | 1.8 segundos | < 200 ms | Q4 2026 | API Gateway |
| **KPI-03** | Uptime mensual del servicio de órdenes | No | 98.2% | 99.9% | Q4 2026 | Monitor Cloud |
| **KPI-04** | Tiempo de resolución de disputas de pago | No | 24 horas | < 1 hora | Q4 2026 | Billing Service |
| **KPI-05** | Coincidencia de stock físico vs digital | No | 75% | ≥ 98% | Q4 2026 | Kitchen Service |

---

## 9. Objetivos de Negocio (SMART)

*   **BO-01 (Escalabilidad):** Soportar un volumen de hasta 10,000 pedidos concurrentes por hora en picos festivos para Q4 2026, reduciendo los errores de timeout a 0%.
*   **BO-02 (Latencia):** Reducir el tiempo promedio de respuesta percibido del cliente en el checkout a menos de 200 ms en el 95% de las solicitudes para finales de 2026.
*   **BO-03 (Resiliencia):** Lograr una resiliencia del 100% ante caídas de la pasarela Stripe, encolando transacciones en Kafka de forma transparente sin rechazar la compra del cliente.

---

## 10. Stakeholders y Roles (Modelo RACI)

| Stakeholder | Interés | R / A / C / I |
| :---- | :---- | :---- |
| Sponsor (MAE FTGO) | Estratégico y Financiero | A |
| Jefe de Operaciones (Roger) | Operativo del negocio | R |
| Operador de Cocina (Sandra) | Uso de cocina y menús | C |
| Equipo de Ingeniería de Software | Diseño e implementación | R |
| Entidades Reguladoras de Pagos | Cumplimiento normativo de cobros | I |
| Pasarelas Externas (Stripe) | Integración técnica | C |

---

## 11. Requerimientos de Negocio

| ID | Requerimiento de negocio | Prioridad (MoSCoW) | Justificación | Métrica de aceptación |
| :---- | :---- | :---- | :---- | :---- |
| **BR-001** | Toma y registro de pedidos asíncrono | Must | Evitar bloqueos de red en checkout | Checkout completado en < 150 ms |
| **BR-002** | Sincronización asíncrona de inventario de cocina | Must | Evitar cancelaciones por falta de stock | Actualización de stock en app en < 5 segundos |
| **BR-003** | Cobro automático mediante Stripe integrado | Must | Automatizar flujo financiero | Registro de transacciones con ID único Stripe |
| **BR-004** | Gestión de tickets en tiempo real para restaurantes | Must | Optimizar preparación de comida | Tickets visibles en la pantalla en < 2 segundos |
| **BR-005** | Tolerancia a fallos con colas de reintento | Must | No perder ventas por caídas externas | Cola reintenta cobros sin caída del front |
| **BR-006** | Generación automática de actas de liquidación | Should | Facilitar contabilidad mensual | Reporte contable mensual emitido en < 5 segundos |
| **BR-007** | Monitoreo y observabilidad distribuida | Should | Depurar errores en microservicios | 100% de logs correlacionados |

---

## 12. Reglas de Negocio y Políticas

*   **RB-01:** Todo pedido debe ser cobrado exitosamente o pre-autorizado antes de enviar el ticket de preparación a la cocina del restaurante.
*   **RB-02:** Si la cocina rechaza un ticket debido a falta de ingredientes, la saga transaccional debe reversar y reembolsar automáticamente el cobro en Stripe en menos de 60 segundos.
*   **RB-03:** Un courier no puede ser asignado a más de una entrega activa simultáneamente para resguardar la temperatura de la comida.

---

## 13. Supuestos, Restricciones y Dependencias

*   **Supuestos:** 
    *   Los restaurantes disponen de tabletas con conexión a internet estable en sus cocinas.
    *   Los couriers cuentan con smartphones con GPS activo.
*   **Restricciones:**
    *   El presupuesto de migración está delimitado por el comité financiero.
    *   La migración debe completarse de forma incremental mediante Strangler Fig sin apagar el monolito legacy.
*   **Dependencias:**
    *   Disponibilidad de las APIs externas de Stripe y Google Maps.
    *   Coexistencia del bus de eventos Kafka con la base de datos relacional del monolito WAR remanente.

---

## 14. Alcance de Negocio

### 14.1 En Alcance (Fase 1)
*   Descomposición de las capacidades de `Order Taking` y `Billing & Accounting` en microservicios autónomos con bases de datos independientes.
*   Configuración del bus de eventos Kafka y orquestación de la Saga de creación de pedidos.
*   API Gateway para enrutamiento inteligente.

### 14.2 Fuera de Alcance (Fase 1)
*   Descomposición de la logística de `Delivery` y del módulo de tracking GPS (permanecen en el monolito legacy temporalmente).
*   Consola de soporte administrativo de back office (permanece consumiendo APIs del monolito).

---

## 15. Beneficios Esperados y Business Case

| Tipo | Año 1 | Año 2 | Año 3 |
| :---- | :---- | :---- | :---- |
| Ahorro por reducción de cancelaciones | Bs. 105,000 | Bs. 126,000 | Bs. 140,000 |
| Eficiencia operativa en servidores cloud | Bs. 20,000 | Bs. 30,000 | Bs. 45,000 |
| Inversión Requerida (CAPEX) | Bs. 80,000 | Bs. 10,000 | Bs. 10,000 |
| **Flujo de Caja Neto** | **Bs. 45,000** | **Bs. 146,000** | **Bs. 175,000** |
| **VAN (tasa 10%)** | **Bs. 278,500** | | |
| **TIR** | **68%** | | |

---

## 16. Riesgos de Negocio

| Riesgo | Probabilidad | Impacto | Mitigación | Responsable |
| :---- | :---- | :---- | :---- | :---- |
| Inconsistencia de datos durante la coexistencia | Media | Alto | Implementar adaptadores temporales bidireccionales y chequeo de paridad. | Arquitecto |
| Resistencia de los restaurantes a usar la nueva consola | Baja | Medio | Capacitación virtual y soporte técnico 24/7. | Operaciones |
| Overhead de latencia por saltos de red | Media | Medio | Uso de gRPC para llamadas internas y Sagas asíncronas para el checkout. | Líder Técnico |

---

## 17. Criterios de Éxito del Proyecto

*   Lograr una coincidencia físico-digital de ingredientes de cocina de **≥ 98%**.
*   Registrar un Uptime del servicio de órdenes de **99.9%** durante el horario de almuerzo y cena.
*   Reducción comprobada en un **50%** de los tiempos de checkout percibidos por los consumidores finales.

---

## 18. Trazabilidad

| BRD ID | MRD relacionado | PRD relacionado | Caso de uso FSD |
| :---- | :---- | :---- | :---- |
| **BR-001** | MRD-N-01 | PRD-REQ-001 | UC-01: Realizar Pedido |
| **BR-002** | MRD-N-02 | PRD-REQ-002 | UC-02: Aceptar/Rechazar Ticket |
| **BR-003** | MRD-N-04 | PRD-REQ-003 | UC-04: Procesar Pago |
| **BR-005** | MRD-N-05 | PRD-REQ-005 | UC-05: Tracking en Tiempo Real |

---

## 19. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| :---- | :---- | :---- | :---- |
| Sponsor | Lic. Armando Ríos | *Aprobado digitalmente* | 20/05/2026 |
| PM | Guillermo Daza | *Firmado* | 20/05/2026 |
| Arquitecto | Equipo Activa360 | *Firmado* | 20/05/2026 |

---

## 20. Registro de cambios

| Versión | Fecha | Autor | Cambio |
| :---- | :---- | :---- | :---- |
| v0.1 | 20/05/2026 | Guillermo Daza | Versión inicial del BRD para el caso de estudio de FTGO. |
