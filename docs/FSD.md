# Functional Specification Document (FSD) Ligero — Caso FTGO

Este documento define la especificación funcional y el comportamiento detallado del sistema FTGO para guiar la fase de implementación y pruebas automatizadas. Contiene 5 Casos de Uso críticos detallados con escenarios BDD (Given/When/Then) para asegurar que el comportamiento de la plataforma sea verificable de forma precisa.

---

## 1. Introducción

El presente FSD especifica los flujos funcionales del núcleo de negocio de la plataforma FTGO en su arquitectura objetivo. Esta guía sirve como contrato funcional entre los analistas de negocio, los arquitectos de software y los ingenieros de control de calidad (QA). Cada caso de uso detallado define escenarios bajo la metodología BDD (Behavior-Driven Development), lo que permite traducirlos de forma directa a pruebas automáticas de aceptación (como Cucumber o Jest/Gherkin) y validar la integridad de la migración incremental frente a las reglas de negocio establecidas.

---

## 2. Tabla Resumen de Casos de Uso

| ID | Caso de Uso (UC) | Actor Primario | Capacidad del PRD | Origen de Negocio |
| :--- | :--- | :--- | :--- | :--- |
| **UC-01** | Realizar Pedido | Consumidor | Order Taking | US-01 (Brief) |
| **UC-02** | Aceptar o Rechazar Ticket | Restaurante | Order Fulfillment | US-02 (Brief) |
| **UC-03** | Asignar y Confirmar Entrega | Courier | Delivery | US-03 (Brief) |
| **UC-04** | Procesar Pago del Pedido | Sistema / Pasarela | Billing & Accounting | Libro Cap 3 / PRD |
| **UC-05** | Tracking de Pedido en Tiempo Real | Consumidor | Delivery / Notifications | NFR-03 / PRD |

---

## 3. Detalle de Casos de Uso

### UC-01: Realizar Pedido
* **Actor Primario:** Consumidor.
* **Capacidad PRD Asociada:** `Order Taking`.
* **Origen:** `US-01: Toma de pedido por el consumidor` [Brief §A.5].
* **Precondiciones:**
  1. El Consumidor ha iniciado sesión en la aplicación móvil o web.
  2. El Restaurante seleccionado está en estado *Activo* y en horario de atención.
* **Flujo Principal:**
  1. El Consumidor visualiza el menú vigente del restaurante y selecciona platos.
  2. El Consumidor agrega los ítems elegidos a su carrito de compras.
  3. El Consumidor avanza al checkout, confirma su dirección de entrega predeterminada y selecciona su método de pago guardado.
  4. El Consumidor presiona "Confirmar Pedido".
  5. El sistema valida la disponibilidad de stock de los ingredientes y el estado del restaurante.
  6. El sistema crea el pedido en estado `PENDING_PAYMENT` y retorna un número de pedido único de 10 dígitos.
* **Flujos Alternativos:**
  * **[ALT-01.1]: Menú Desactualizado / Falta de Stock:**
    1. Si en el paso 5 un ítem del menú ya no está disponible, el sistema cancela la creación del pedido.
    2. El sistema devuelve un error indicando: *"El plato [Nombre] ya no cuenta con stock disponible."* y mantiene el carrito activo para edición.
* **Postcondiciones:**
  * El pedido queda registrado en la base de datos de órdenes en estado `PENDING_PAYMENT` y se reserva el saldo temporal en el carrito.
* **Escenario BDD (Given/When/Then):**
  * **Given** el Consumidor "Juan Perez" tiene un carrito activo con el plato "Pizza Margherita" del restaurante "Luigi's Pizza" en estado activo.
  * **When** el Consumidor confirma la compra con una dirección de entrega válida y método de pago configurado.
  * **Then** el sistema registra el pedido en estado "PENDING_PAYMENT" y le muestra a Juan el código de orden único "FTGO-987654".

---

### UC-02: Aceptar o Rechazar Ticket de Pedido
* **Actor Primario:** Restaurante (Operador de Cocina).
* **Capacidad PRD Asociada:** `Order Fulfillment / Kitchen`.
* **Origen:** `US-02: Aceptación de tickets por el restaurante` [Brief §A.5].
* **Precondiciones:**
  1. El pedido ha sido pagado exitosamente y está en estado `PREPARATION_PENDING`.
  2. El operador del restaurante está logueado en la consola web de cocina de FTGO.
* **Flujo Principal:**
  1. El operador recibe una notificación sonora y visual en el dashboard de cocina mostrando los detalles del nuevo ticket.
  2. El operador selecciona el ticket, ingresa el tiempo estimado de preparación en minutos (ej. 35 min) y presiona "Aceptar Pedido".
  3. El sistema cambia el estado del pedido a `ACCEPTED_BY_RESTAURANT` y despacha un evento `OrderAccepted` al broker de mensajería.
  4. El sistema notifica al consumidor sobre el nuevo estado y el tiempo estimado de entrega.
* **Flujos Alternativos:**
  * **[ALT-02.1]: Rechazo de Ticket por Alta Demanda de Cocina:**
    1. Si el operador del restaurante presiona "Rechazar Pedido", el sistema le exige seleccionar un motivo de rechazo (ej. *"Cocina saturada"* o *"Ingredientes agotados"*).
    2. El sistema cancela el pedido, actualiza su estado a `REJECTED_BY_RESTAURANT` y publica un evento `OrderRejected` para disparar el reembolso automático.
    3. El sistema envía una notificación push al consumidor informando la cancelación del pedido.
* **Postcondiciones:**
  * El pedido pasa al estado `ACCEPTED_BY_RESTAURANT` o `REJECTED_BY_RESTAURANT` de forma definitiva en la base de datos de cocina.
* **Escenario BDD (Given/When/Then):**
  * **Given** que el restaurante "Luigi's Pizza" tiene en su dashboard un ticket "FTGO-987654" en estado "PREPARATION_PENDING".
  * **When** el operador acepta el ticket ingresando un tiempo estimado de preparación de "30" minutos.
  * **Then** el sistema actualiza el estado de la orden a "ACCEPTED_BY_RESTAURANT", publica el evento "OrderAccepted" en Kafka y notifica al cliente que su pizza estará lista en 30 minutos.

---

### UC-03: Asignar y Confirmar Entrega
* **Actor Primario:** Courier.
* **Capacidad PRD Asociada:** `Delivery`.
* **Origen:** `US-03: Asignación de entrega al courier` [Brief §A.5].
* **Precondiciones:**
  1. El Courier está logueado en la aplicación móvil de repartidores y ha marcado su estado como *Disponible*.
  2. El pedido en el restaurante ha pasado al estado `PREPARING` en la base de datos de cocina.
* **Flujo Principal:**
  1. El sistema de asignación de FTGO calcula la cercanía geográfica de los couriers disponibles respecto a la ubicación del restaurante.
  2. El sistema envía una oferta de entrega a la pantalla del Courier seleccionado con los detalles de ganancia y distancia.
  3. El Courier presiona "Aceptar Oferta" en un lapso menor a 30 segundos.
  4. El sistema asigna el pedido al Courier, bloquea su disponibilidad para otros viajes y cambia el estado de la entrega a `COURIER_ASSIGNED`.
  5. El sistema muestra al Courier la ruta óptima en el mapa hacia el restaurante.
* **Flujos Alternativos:**
  * **[ALT-03.1]: Rechazo / Timeout de la Asignación:**
    1. Si el Courier presiona "Rechazar Oferta" o si expira el tiempo de espera de 30 segundos sin respuesta, el sistema cancela la oferta para ese courier.
    2. El sistema busca de forma automática al siguiente courier disponible más cercano y le envía la oferta de asignación, repitiendo el flujo principal.
* **Postcondiciones:**
  * El Courier seleccionado queda formalmente asignado a la entrega del pedido y se inicia el rastreo GPS.
* **Escenario BDD (Given/When/Then):**
  * **Given** el Courier "Carlos Gomez" está con estado "Disponible" a 500 metros del restaurante "Luigi's Pizza".
  * **When** el sistema le envía una oferta para entregar el pedido "FTGO-987654" y Carlos la acepta en 15 segundos.
  * **Then** el sistema cambia el estado del pedido a "COURIER_ASSIGNED", bloquea a Carlos para otras entregas y le renderiza la ruta GPS hacia el local de pizzas.

---

### UC-04: Procesar Pago del Pedido
* **Actor Primario:** Sistema (Orquestador de Pagos / Stripe).
* **Capacidad PRD Asociada:** `Billing & Accounting`.
* **Origen:** Capítulo 3 (Patrón Saga Transaccional) e integraciones con sistemas externos de pago [Brief §A.4].
* **Precondiciones:**
  1. Un pedido ha sido creado y se encuentra en estado `PENDING_PAYMENT` en la base de datos de órdenes.
  2. El Consumidor tiene un token de tarjeta Stripe válido registrado en su perfil.
* **Flujo Principal:**
  1. El servicio `Billing Service` captura el evento de creación del pedido y realiza una llamada HTTP segura a la API de Stripe solicitando el cargo por el monto exacto de la orden.
  2. Stripe procesa la transacción y devuelve una confirmación con un identificador de cobro único (`Charge ID`).
  3. El sistema actualiza el estado del pedido en la base de datos de facturación a `PAID`, asocia el `Charge ID` e inicia la ejecución de la Saga de Pedidos para notificar a la cocina.
* **Flujos Alternativos:**
  * **[ALT-04.1]: Pago Rechazado por Fondos Insuficientes:**
    1. Si la API de Stripe devuelve un código de rechazo (ej. `card_declined`), el sistema de facturación registra la transacción como fallida.
    2. El sistema de órdenes actualiza el estado de la orden a `PAYMENT_FAILED` y libera la reserva de ingredientes en la cocina.
    3. El sistema notifica al Consumidor vía push informando que el pago fue rechazado y solicitando cambiar de tarjeta de crédito.
* **Postcondiciones:**
  * El pedido queda en estado `PAID` con un registro de auditoría de cobro en la base de datos, o en estado `PAYMENT_FAILED` con la orden cancelada de manera segura.
* **Escenario BDD (Given/When/Then):**
  * **Given** que el pedido "FTGO-987654" de un valor de "$25.50" está en estado "PENDING_PAYMENT".
  * **When** el servicio de facturación solicita el cobro a Stripe y la pasarela responde con una confirmación "ch_3Mv98L".
  * **Then** el sistema actualiza la orden "FTGO-987654" a estado "PAID", asocia el ID de cobro "ch_3Mv98L" y despacha el evento "OrderPaid" al broker de mensajería.

---

### UC-05: Tracking de Pedido en Tiempo Real
* **Actor Primario:** Consumidor.
* **Capacidad PRD Asociada:** `Delivery` / `Notifications`.
* **Origen:** NFR-03 (Uptime tracking) y NFR-02 (Latencia interactiva) [Brief §A.4].
* **Precondiciones:**
  1. El pedido se encuentra en estado `COURIER_ASSIGNED`, `PICKED_UP` o `DELIVERING`.
  2. El Courier asignado tiene encendido el GPS de su smartphone con la app activa de repartidores de FTGO.
* **Flujo Principal:**
  1. La aplicación móvil del Courier envía de forma periódica coordenadas GPS (latitud, longitud) cada 10 segundos al microservicio `Delivery Service`.
  2. El Consumidor abre la pantalla de detalles de su pedido en su aplicación móvil o web.
  3. El sistema lee las coordenadas GPS más recientes del Courier y las renderiza visualmente en un mapa interactivo para el consumidor.
  4. El sistema muestra el estado actual de la entrega y calcula de forma dinámica el tiempo estimado de llegada (ETA) mediante la API de rutas.
* **Flujos Alternativos:**
  * **[ALT-05.1]: Pérdida Temporal de Señal GPS del Courier:**
    1. Si el sistema no recibe coordenadas del Courier durante un intervalo mayor a 45 segundos (ej. zona de túneles o sin datos), mantiene en pantalla la última ubicación conocida del courier.
    2. El mapa muestra una alerta sutil indicando: *"Actualizando ubicación del repartidor..."*.
    3. Tan pronto como el Courier recupera la conectividad y envía nuevas coordenadas, el mapa actualiza la posición del marcador en tiempo real de forma automática.
* **Postcondiciones:**
  * El consumidor visualiza la ubicación exacta y el tiempo de llegada estimado sin que se altere el estado físico de la orden en la base de datos.
* **Escenario BDD (Given/When/Then):**
  * **Given** el consumidor "Juan Perez" está visualizando la pantalla de tracking del pedido "FTGO-987654" en estado "DELIVERING".
  * **When** el celular del Courier asignado envía sus coordenadas GPS actualizadas "Lat: -17.3941, Lng: -66.1558".
  * **Then** la aplicación web de Juan actualiza de forma automática el marcador en el mapa en menos de 1 segundo y le indica que su comida llegará en "5 minutos".
