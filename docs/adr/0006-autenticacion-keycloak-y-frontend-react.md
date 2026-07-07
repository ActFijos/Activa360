# ADR 0006: Adopción de Keycloak para Autenticación y React para el Frontend Web

## Estado
**Aceptada**

## Contexto
El sistema Activa360 requiere un mecanismo robusto, estandarizado y seguro de gestión de identidades y accesos (IAM), con soporte para autenticación y autorización (AuthN/AuthZ) basado en roles (RBAC). 
Además, debe ser compatible con un esquema híbrido de despliegue: en los servidores de la UMSS (On-Premise) debe poder federarse o integrarse con el Active Directory / LDAP de la institución, y en despliegues comerciales en la nube debe integrarse fácilmente.
Para la interfaz de usuario web del administrador y los jefes de activos, se requiere un framework moderno, altamente reactivo y con soporte robusto de componentes y seguridad para interactuar con la API Gateway del backend.

## Decisión
1. Adoptar **Keycloak** como el proveedor de identidad (IdP) central y servidor de autenticación para todo el ecosistema de Activa360.
   * Utilizará protocolos estándar del sector como OpenID Connect (OIDC) y OAuth2.
   * Keycloak correrá contenerizado (Docker) tanto localmente para entornos de desarrollo y On-Premise, como a través de servicios administrados o contenedores en la nube.
   * Keycloak actuará como puente para federar identidades con el Directorio Activo/LDAP de la UMSS.
2. Utilizar **React (SPA)** como la tecnología principal para el desarrollo de la aplicación web de administración, garantizando una arquitectura moderna desacoplada del backend.

## Consecuencias
* **Positivas:**
  * **Seguridad Estandarizada:** Delegamos la autenticación a un estándar de la industria (OAuth2/OIDC) evitando implementar lógica personalizada propensa a vulnerabilidades.
  * **Flexibilidad Híbrida:** Keycloak puede federar LDAP locales (UMSS) y al mismo tiempo funcionar en la nube sin cambiar el código de los microservicios.
  * **Single Sign-On (SSO):** Facilidad para incorporar nuevas aplicaciones en el futuro bajo el mismo inicio de sesión único.
  * **Modularidad del Frontend:** React permite construir un Dashboard dinámico, interactivo y con un consumo eficiente de recursos del cliente mediante Single Page Application (SPA).
* **Negativas / Trade-offs:**
  * Incremento en la complejidad de la infraestructura de despliegue al requerir y administrar un contenedor/instancia de Keycloak.
  * Curva de aprendizaje inicial para la configuración de Realms, Clientes, Roles y Scopes en la consola de Keycloak.
