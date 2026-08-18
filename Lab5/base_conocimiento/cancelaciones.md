# Cancelaciones y cambios de pedido — SoporteIA

## Cuándo se puede cancelar

Un pedido se puede cancelar sin costo mientras esté en estado RECIBIDO o
EN PREPARACIÓN. En esos estados el pedido todavía no salió del almacén.

Una vez que el pedido pasa a DESPACHADO ya no se puede cancelar desde el
sistema: se debe rechazar la entrega o iniciar una devolución.

Los pedidos en estado ENTREGADO no se cancelan; se tratan bajo la política
de devoluciones.

## Quién autoriza la cancelación

La cancelación de un pedido es una acción de escritura sobre datos reales.
Ningún asistente automático puede ejecutarla por su cuenta: siempre requiere
confirmación explícita del cliente o de un agente humano autorizado.

Toda cancelación queda registrada en el log de auditoría con la fecha, el
número de pedido, el motivo y el usuario que la autorizó.

## Cambios de producto o dirección

El cambio de dirección de entrega se acepta mientras el pedido no esté
DESPACHADO. Después de eso, el cambio depende de la transportadora y puede
generar un costo adicional.

El cambio de producto no existe como operación: se cancela el pedido y se
genera uno nuevo, siempre que el original no haya sido despachado.

## Reembolso por cancelación

Cuando la cancelación ocurre antes del despacho, el reembolso es total y se
procesa en un plazo de 5 días hábiles.

Cuando el cliente rechaza la entrega, se descuenta el costo logístico de ida
y vuelta antes de emitir el reembolso.
