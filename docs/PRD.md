# Product Requirement Document (PRD) Ligero — Caso FTGO (Food To Go)

Este documento define los requisitos funcionales y de calidad de negocio para guiar el rediseño y la migración incremental del sistema monolítico de FTGO hacia una arquitectura moderna basada en microservicios, utilizando el patrón *Strangler Fig* (Higo Estrangulador).

---

## 1. Contexto y Objetivos

### Contexto de Negocio
FTGO (Food To Go) es un marketplace consolidado que conecta consumidores con restaurantes locales para ofrecer la entrega de comida a domicilio a través de una red de couriers independientes. Actualmente, el núcleo tecnológico de la plataforma opera sobre una **aplicación monolítica empaquetada como un archivo Java WAR**.

Con el crecimiento continuo de la plataforma, el sistema monolítico ha alcanzado un estado crítico denominado **"infierno monolítico"** (Cap 1, Richardson):
1. **Builds y Despliegues Lentos:** El tamaño masivo del repositorio bloquea los pipelines de entrega continua.
2. **Escalado Ineficiente:** El módulo de rastreo en tiempo real requiere escalamiento intensivo de CPU, obligando a escalar todo el monolito (incluyendo módulos pasivos) con un costo de infraestructura prohibitivo.
3. **Falta de Aislamiento de Fallas:** Un error de memoria en la pasarela de notificaciones o mapas tumba el flujo completo de toma de pedidos.
4. **Bloqueo Tecnológico:** Impedimento para adoptar tecnologías modernas debido a dependencias acopladas en Java heredadas.

### Objetivos de la Migración
El objetivo estratégico del equipo de arquitectura es desglosar el monolito legacy de forma incremental en un ecosistema de **microservicios autónomos y desacoplados**, permitiendo a los equipos de desarrollo entregar características de forma independiente, optimizar costos de nube y mejorar la disponibilidad global de la plataforma sin interrumpir las operaciones en curso.

---

## 2. Stakeholders

El sistema objetivo debe satisfacer las necesidades operativas y de experiencia de los siguientes 5 stakeholders clave:

1. **Consumidor (Usuario Final):**
   * *Descripción:* Persona natural que utiliza el canal web o móvil para ordenar comida.
   * *Necesidad Primaria:* Interfaz ágil (< 200 ms), transparencia en el costo total, seguridad en transacciones de pago y visibilidad del estado de su pedido en tiempo real.
2. **Restaurante (Socio Comercial):**
   * *Descripción:* Negocio asociado que elabora los menús de comida y procesa los pedidos.
   * *Necesidad Primaria:* Un panel de control intuitivo para aceptar/rechazar tickets de pedidos, gestionar la disponibilidad y stock de platos de su cocina en tiempo real y visualizar reportes financieros.
3. **Courier (Repartidor):**
   * *Descripción:* Trabajador independiente responsable de recoger la comida de la cocina del restaurante y entregarla al consumidor.
   * *Necesidad Primaria:* Asignación confiable y cercana a su geolocalización, optimización de rutas de entrega y pagos transparentes por entrega realizada.
4. **Empleado FTGO (Back Office):**
   * *Descripción:* Personal interno de soporte al cliente, finanzas y operaciones.
   * *Necesidad Primaria:* Consolas de monitoreo, capacidad para resolver disputas entre restaurantes/consumidores y herramientas de conciliación de facturas.
5. **Sistemas Externos:**
   * *Descripción:* Interfaces de terceros acopladas al ciclo de vida del pedido.
   * *Necesidad Primaria:* Integraciones robustas con la pasarela de pagos (Stripe), mapas y geolocalización (Google Maps) y pasarelas de mensajería (SendGrid / Twilio) con SLAs de comunicación bien definidos.

---

## 3. Capacidades de Negocio ( Richardson Cap 2 )

Basándonos en la descomposición de capacidades estables de negocio del Capítulo 2 del libro de Chris Richardson, el sistema FTGO se compone de las siguientes 7 capacidades:

1. **Consumer Management:**
   * *Responsabilidad:* Administrar los perfiles de los usuarios finales, direcciones de envío guardadas, preferencias alimenticias, historiales de pedidos y credenciales de autenticación.
2. **Restaurant Management:**
   * *Responsabilidad:* Mantener la información comercial de los restaurantes asociados, sus menús digitales versionados (platos, precios, ingredientes), horarios de operación y disponibilidad horaria de la cocina.
3. **Order Taking:**
   * *Responsabilidad:* Orquestar la creación de nuevos pedidos. Esto incluye la validación de ítems del carrito contra menús vigentes, cálculo de precios finales con impuestos y cargos por entrega, y el flujo de confirmación.
4. **Order Fulfillment / Kitchen:**
   * *Responsabilidad:* Gestionar el ciclo de vida del pedido dentro de la cocina del restaurante. Transforma un pedido confirmado en un ticket de cocina, notificando al cocinero sobre la preparación y manejando los estados: *Aceptado*, *Preparando*, y *Listo para retirar*.
5. **Delivery:**
   * *Responsabilidad:* Coordinar la logística de entrega. Se encarga de la geolocalización en tiempo real de couriers, asignación inteligente de pedidos mediante algoritmos de cercanía, optimización de rutas de entrega y tracking en tiempo real.
6. **Billing & Accounting:**
   * *Responsabilidad:* Gestionar los flujos monetarios de la plataforma. Realiza cobros a los consumidores mediante pasarelas externas, procesa comisiones de FTGO y gestiona la dispersión de pagos (payouts) acumulados a restaurantes y couriers.
7. **Notifications:**
   * *Responsabilidad:* Orquestar y enviar las comunicaciones operacionales y de marketing a través de múltiples canales (Push notifications en la app, SMS para alertas críticas a couriers y correos electrónicos con facturas PDF).

---

## 4. Requisitos No Funcionales (NFRs)

Cada requisito no funcional del sistema está diseñado de forma cuantificable y cuenta con trazabilidad directa a las restricciones del brief de negocio:

### NFR-01: Escalabilidad en Tráfico Pico (Carga)
* **Métrica:** Soportar un pico de tráfico concurrente de hasta **5x** la carga promedio normal durante los horarios de almuerzo (12:00 - 14:00) y cena (19:00 - 22:00) sin degradación del sistema.
* **Origen:** [Brief §A.4 Carga]
* **Justificación:** Los microservicios de toma de pedidos y notificaciones deben poder escalarse de forma horizontal independiente utilizando el Scale Cube (Y-axis) para tolerar picos intensivos de fin de semana.

### NFR-02: Latencia de Respuesta Percibida (UX)
* **Métrica:** Tiempo de respuesta del servidor percibido de **< 200 ms p95** para todas las acciones del consumidor dentro de los canales móviles/web (búsqueda de restaurantes y agregar al carrito).
* **Origen:** [Brief §A.4 Latencia UX]
* **Justificación:** Una latencia mayor de 200 ms en aplicaciones móviles correlaciona directamente con abandono de carritos y pérdida de conversión de ventas en marketplaces.

### NFR-03: Alta Disponibilidad Operacional
* **Métrica:** **99.9%** de uptime mensual mínimo del flujo crítico de toma de pedidos (`Order Taking`); el servicio de tracking de couriers puede degradar de manera aceptada hasta un **99.5%**.
* **Origen:** [Brief §A.4 Disponibilidad]
* **Justificación:** Cada minuto de caída en la creación de pedidos representa pérdidas de ingresos directas para los restaurantes y la plataforma.

### NFR-04: Resiliencia ante Caídas de Servicios Externos
* **Métrica:** El sistema debe poder aceptar pedidos en cola con reintentos asíncronos y mantener el flujo operativo de checkout incluso si la pasarela de pagos (Stripe) está caída. Se acepta degradación en el servicio de mapas (Google Maps) mostrando texto plano de direcciones si el API de georuta falla.
* **Origen:** [Brief §A.4 Tolerancia a fallos externos]
* **Justificación:** Evitar la frustración del usuario rebotando transacciones; se adopta consistencia eventual con reintentos asíncronos en colas de mensajería (Broker).

### NFR-05: Trazabilidad y Observabilidad Distribuida
* **Métrica:** El 100% de las peticiones HTTP/gRPC entre los microservicios y el monolito legacy deben incluir un ID de Correlación (`Correlation ID`) inyectado en las cabeceras, permitiendo el rastreo distribuido de extremo a extremo con un 0% de pérdida de logs críticos en el flujo de pedidos.
* **Origen:** [Brief §A.4 Trazabilidad]
* **Justificación:** En una arquitectura distribuida de microservicios, depurar errores sin rastreo distribuido es inviable.

---

## 5. Alcance

Para garantizar una transición exitosa sin el riesgo de un despliegue "Big-Bang" (frecuentemente fallido), el alcance del proyecto se divide en fases utilizando la técnica de *Strangler Fig*:

### En Alcance (Fase 1 de Migración)
* **Descomposición del Core de Pedidos:** Extracción de las capacidades **Order Taking** y **Billing & Accounting** como microservicios independientes programados en Java con Spring Boot.
* **Base de Datos por Servicio:** Migración de los datos de pedidos desde la base de datos centralizada del monolito hacia una base de datos física independiente para el `Order Service` para asegurar autonomía transaccional.
* **Gateway API:** Implementación de un API Gateway centralizado para enrutar el tráfico de consumidores hacia los nuevos microservicios o hacia el monolito remanente según el estado de la migración.
* **Broker de Eventos:** Configuración de un Event Broker (Kafka) para coordinar la sincronización de estados del ciclo de vida del pedido entre microservicios.

### Fuera de Alcance (Fase 1 de Migración)
* **Descomposición de Logística de Entrega (Delivery):** La capacidad de *Delivery* (asignación y tracking de couriers en tiempo real) se mantendrá operando temporalmente dentro del monolito Java legacy para no introducir excesiva complejidad en la Fase 1.
* **Back Office Integrado:** La consola interna del personal de soporte seguirá consumiendo los datos directamente del monolito WAR remanente mediante APIs REST secundarias.
