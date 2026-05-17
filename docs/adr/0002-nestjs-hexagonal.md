# ADR 0002: Uso de NestJS y Arquitectura Hexagonal en el Backend

## Estado
**Aceptada**

## Contexto
El sistema Activa360 no operará de forma aislada. Deberá integrarse bidireccionalmente con sistemas heredados de la institución (SIAF / VSIAF) y con el directorio activo (SSO) de la UMSS.
Además, las reglas de negocio en instituciones gubernamentales bolivianas cambian frecuentemente (normativa SABS), por lo que el núcleo del sistema debe ser resistente a cambios tecnológicos en las interfaces o bases de datos subyacentes.

## Decisión
Adoptaremos **NestJS (TypeScript)** como framework de backend y estructuraremos el código bajo el patrón de **Arquitectura Hexagonal (Ports and Adapters)**.
Aislaremos la lógica de negocio puramente en la capa de Dominio (Casos de Uso y Entidades), independiente de cualquier framework o base de datos.
La comunicación con el exterior (Base de datos PostgreSQL, APIs del SIAF) se realizará exclusivamente a través de puertos e inyección de dependencias implementados por adaptadores de infraestructura.

## Consecuencias
* **Positivas:**
  * **Testabilidad:** Se puede probar la lógica de cumplimiento normativo (SABS) al 100% sin necesidad de levantar una base de datos (creando "mocks" de los puertos).
  * **Desacoplamiento:** Si el día de mañana la institución cambia el motor de base de datos o el sistema legacy, solo necesitamos escribir un nuevo Adaptador, sin tocar una sola línea de la lógica Core central.
* **Negativas / Trade-offs:**
  * Curva de aprendizaje más pronunciada para los desarrolladores.
  * Mayor cantidad de archivos y *boilerplate* inicial para crear casos de uso simples debido a la sobrecarga de abstraer todo en puertos y adaptadores.
