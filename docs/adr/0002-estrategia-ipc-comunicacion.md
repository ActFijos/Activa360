# ADR 0002: Estrategia de Comunicación Inter-Proceso (IPC) en FTGO

* **ID:** ADR-0002
* **Título:** Estrategia de Comunicación Inter-Proceso (IPC) para la arquitectura de microservicios de FTGO
* **Status:** Accepted
* **Fecha:** 2026-05-20
* **Autor:** Equipo de Arquitectura FTGO

---

## 1. Contexto

Con la adopción del patrón *Strangler Fig* para migrar incrementalmente el monolito Java WAR a microservicios (ADR-0001), el sistema pasa de ser una aplicación en un único proceso de memoria a un sistema distribuido en red. Las llamadas directas a métodos Java entre clases ahora se transforman en llamadas a través de la red.

El rediseño de las capacidades de negocio (como `Order Taking`, `Kitchen` y `Billing & Accounting`) exige una constante coordinación para mantener consistentes los estados de los pedidos. Por ejemplo, al realizar un pedido, se debe validar el menú (`Restaurant Management`), procesar el cobro (`Billing`) y crear el ticket de preparación (`Kitchen`).

El brief de FTGO impone dos restricciones de calidad de alta prioridad para este flujo distribuido:
1. **Latencia Interactiva:** Acciones críticas del consumidor en la interfaz web/móvil deben responder en **< 200 ms p95 (NFR-02)**.
2. **Resiliencia y Tolerancia a Fallos:** El sistema debe poder aceptar pedidos en cola con reintentos automáticos incluso si la pasarela de pagos externa (Stripe) está caída de forma temporal **(NFR-04)**.

Debemos definir el mecanismo predominante de comunicación inter-proceso (IPC) que soporte estas interacciones minimizando el acoplamiento y garantizando el cumplimiento de los NFRs.

---

## 2. Opciones Consideradas

Se evaluaron tres alternativas tecnológicas para la comunicación entre servicios:

### Opción 1: Comunicación Síncrona Predominante vía REST / HTTP (JSON)
* **Descripción:** Los servicios se comunican entre sí de forma directa y síncrona mediante llamadas HTTP/REST utilizando cargas útiles en JSON. Al crear un pedido, el `Order Service` bloquea el hilo de ejecución y llama secuencialmente mediante peticiones HTTP al `Billing Service` y al `Kitchen Service`.
* **Pros:**
  * Simplicidad de diseño e implementación; modelo de programación muy familiar para el equipo de desarrollo.
  * Facilidad para obtener respuestas inmediatas y consistencia fuerte en el flujo secuencial (si falla la llamada de cobro, el hilo de orden se cancela de inmediato).
  * No requiere instalar, mantener ni configurar brokers de mensajería complejos de fondo.
* **Contras:**
  * **Acoplamiento de Disponibilidad:** Si el `Kitchen Service` o el monolito legacy están caídos, el `Order Service` no puede completar la toma de pedidos, violando la tolerancia a fallos del negocio.
  * **Latencia Acumulada:** El tiempo total de la petición HTTP del consumidor es la suma de los tiempos de respuesta de todas las llamadas síncronas en cadena. Es muy difícil garantizar latencias **< 200 ms (NFR-02)** si hay múltiples saltos de red en cascada.
  * Riesgo de bloqueo de hilos (thread exhaustion) en el API Gateway ante picos de tráfico de **5x (NFR-01)**.

### Opción 2: Comunicación Asíncrona Orientada a Eventos Predominante (Event-Driven vía Apache Kafka)
* **Descripción:** Los microservicios interactúan de forma puramente asíncrona mediante la publicación y suscripción de eventos de dominio a través de un Message Broker distribuido (Apache Kafka). Cuando ocurre un cambio en el sistema, el servicio publica un evento (ej. `OrderCreated`) en un topic, y los servicios interesados (`Billing`, `Kitchen`) reaccionan de forma reactiva asíncrona.
* **Pros:**
  * **Desacoplamiento Absoluto:** El `Order Service` puede recibir y almacenar un pedido incluso si el `Kitchen Service` o el `Billing Service` están fuera de línea temporalmente. Los mensajes se encolan de forma segura en Kafka.
  * **Latencia Ultra Baja en Checkout:** El hilo de la petición del consumidor responde casi instantáneamente al confirmar la transacción, ya que solo debe escribir el registro en su base de datos local y publicar el evento a Kafka de forma asíncrona, garantizando tiempos de respuesta **< 100 ms (NFR-02)**.
  * Escalabilidad horizontal masiva; excelente soporte para tolerar picos de carga de **5x (NFR-01)** mediante el buffer natural de las colas de mensajes de Kafka.
* **Contras:**
  * **Complejidad del Modelo de Datos (Consistencia Eventual):** El sistema debe lidiar con consistencia eventual. El pedido se crea inicialmente en estado `PENDING_PAYMENT` y el frontend debe consultar el estado mediante polling o WebSockets para saber si el cobro fue aprobado.
  * Requiere implementar patrones complejos para transacciones distribuidas como **Sagas Coreografiadas u Orquestadas** (Richardson Cap 3) y manejo de duplicados (Idempotencia).
  * Complejidad operativa añadida para desplegar y monitorear un clúster de Apache Kafka.

### Opción 3: Modelo Híbrido (REST Síncrono para Consultas y Eventos Asíncronos para Mutaciones / Sagas)
* **Descripción:** Se combina lo mejor de ambos mundos:
  1. **Mutaciones y Estados (Flujo Crítico):** Se utiliza comunicación asíncrona orientada a eventos para todos los flujos que alteran el estado del sistema y requieren alta resiliencia (ej. creación de órdenes, pagos y procesamiento en cocina), coordinando los flujos mediante Sagas.
  2. **Consultas (Lectura):** Se utiliza comunicación síncrona mediante REST/HTTP (o gRPC de baja latencia) cuando el cliente o un servicio requieren una respuesta inmediata de solo lectura que no altera estados (ej. consultar el menú vigente del restaurante o ver el perfil de direcciones guardado del cliente).
* **Pros:**
  * Ofrece la máxima resiliencia en el flujo transaccional crítico (NFR-04) mediante colas asíncronas, mientras mantiene un modelo de programación simple y directo para las consultas de solo lectura de la interfaz.
  * Evita la complejidad innecesaria de implementar mecanismos reactivos asíncronos para simples solicitudes de información de sólo lectura.
  * Excelente alineación con el patrón CQRS (Command Query Responsibility Segregation) sugerido por Richardson en capítulos avanzados.
* **Contras:**
  * El equipo de desarrollo debe dominar ambos estilos de programación e infraestructura de forma simultánea.
  * Se requiere definir estándares claros sobre cuándo utilizar gRPC/REST frente a cuándo publicar eventos en Kafka para evitar inconsistencias de diseño.

---

## 3. Decisión

Se decide adoptar la **Opción 3: Modelo Híbrido (REST Síncrono para Consultas y Eventos Asíncronos para Mutaciones / Sagas)** como la estrategia predominante de comunicación inter-proceso para la arquitectura de FTGO.

### Justificación
Esta estrategia es la única que satisface de forma balanceada e integral las restricciones de latencia interactiva **(NFR-02)** y de resiliencia ante caídas externas **(NFR-04)** del brief:

* El flujo de **checkout y toma de pedidos (UC-01)** se vuelve asíncrono y se gestiona mediante una Saga orquestada en Kafka. Esto permite responder al consumidor en **< 100 ms** (cumpliendo sobradamente el NFR-02) y encolar el cobro de forma segura incluso si Stripe está fuera de línea (cumpliendo el NFR-04).
* Las consultas pesadas como listar menús de restaurantes se mantendrán síncronas mediante gRPC/REST directo desde el API Gateway hacia el `Restaurant Service` para evitar la sobre-ingeniería de flujos asíncronos en simples lecturas de catálogo.

---

## 4. Consecuencias

### Consecuencias Positivas (Beneficios)
* **Resiliencia Operativa Extrema:** Si el monolito legacy o el sistema de cocina se caen temporalmente, los pedidos de los clientes siguen siendo tomados y guardados en colas de reintento. Ninguna venta se pierde de forma inmediata.
* **Experiencia de Usuario Fluida (UX):** El consumidor experimenta una interfaz sumamente rápida al presionar "Confirmar Compra", ya que el procesamiento pesado de pagos y coordinación de cocina ocurre en segundo plano de manera asíncrona.
* **Desacoplamiento de Servicios:** Los microservicios no conocen las rutas IP ni los nombres de red de los otros servicios; solo se acoplan al esquema de eventos de dominio publicados en Kafka.

### Consecuencias Negativas (Trade-offs / Costos)
* **Complejidad del Manejo de Estados:** Al usar Sagas asíncronas para el flujo de pedidos y facturación, los desarrolladores deben programar de forma obligatoria **Transacciones Compensatorias** (ej. si el cobro se aprueba pero la cocina rechaza el pedido en UC-02, la Saga debe disparar de forma automática el reembolso asíncrono en Stripe).
* **Manejo de Mensajes Duplicados:** Al ser una red distribuida, el broker (Kafka) garantiza entrega *"at least once"*, lo que obliga a que todos los consumidores de eventos implementen controles de **Idempotencia** (ej. evitar cobrar dos veces el mismo pedido ante un reintento de red).
* **Consistencia Eventual en la Interfaz:** El consumidor no verá su orden como "Aceptada" de forma instantánea. Se requiere que la aplicación móvil implemente WebSockets o Polling contra el API Gateway para actualizar visualmente la pantalla una vez que la Saga asíncrona se complete.
