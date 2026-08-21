# ADR 0001: Adopción de React Native con enfoque Offline-First

## Estado
**Aceptada**

## Contexto
El proceso de levantamiento de inventarios (activos fijos) se realiza con frecuencia en sótanos, almacenes remotos y recintos de la UMSS donde la conectividad a Internet (Wi-Fi o datos móviles) es intermitente o nula. 
Los inventariadores necesitan poder escanear códigos QR y registrar el estado de los bienes sin interrupciones. Si la aplicación dependiera de una conexión en tiempo real a la API, el proceso se paralizaría, afectando severamente el tiempo y eficiencia de la toma de inventarios.

## Decisión
Construiremos la aplicación móvil utilizando **React Native** e implementaremos un modelo de datos **Offline-First**. 
Toda la lectura y escritura de datos por parte del inventariador se hará contra una base de datos local en el dispositivo móvil (utilizando SQLite / WatermelonDB). 
La aplicación mantendrá un registro de "operaciones pendientes" y un proceso en segundo plano (Sync Engine) se encargará de sincronizar de forma asíncrona estos lotes con el servidor central una vez que se recupere la conectividad.

## Consecuencias
* **Positivas:**
  * Disponibilidad del 100% para los usuarios en campo.
  * Tiempos de respuesta inmediatos en la interfaz de usuario, ya que no hay latencia de red.
* **Negativas / Trade-offs:**
  * Incremento en la complejidad de la aplicación móvil (manejo de estado local, colas de sincronización).
  * Posibles conflictos de concurrencia en el servidor si múltiples dispositivos actualizan el mismo activo (requiere un backend robusto para resolución de conflictos basado en timestamps).
  * Aumento del tamaño de la aplicación instalada en el dispositivo móvil al incluir un motor relacional embebido.
