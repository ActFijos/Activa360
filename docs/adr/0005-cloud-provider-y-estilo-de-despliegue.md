# ADR 0005: Adopción de una Arquitectura Híbrida y Cloud‑Native para la Escalabilidad GovTech de Activa360

## Estado
**Aceptada**

## Contexto
El sistema Activa360 tiene como primer cliente estratégico e impulsor a la Universidad Mayor de San Simón (UMSS). Debido a directrices de gobernanza de datos y soberanía de información institucionales, el despliegue primario debe realizarse de manera **On-Premise** dentro de los servidores e infraestructura física de la Dirección de Tecnologías de Información (DTI) de la universidad.

Sin embargo, la visión del producto a mediano plazo (como se establece en el MRD v0.1) es posicionarse como una solución **GovTech en modalidad SaaS multi-tenant** escalable a gobiernos municipales y otras universidades estatales de Bolivia. Restringir la arquitectura del producto exclusivamente a configuraciones de red locales On-Premise limitaría gravemente nuestra capacidad de expansión comercial en el mercado GovTech boliviano y latinoamericano.

Debemos definir un estilo de despliegue que garantice:
1.  **Operación local robusta:** Cumplimiento total de las restricciones On-Premise para la UMSS.
2.  **Escalabilidad SaaS y paridad Cloud:** Un mapeo directo y de bajo esfuerzo hacia servicios administrados de una nube pública para instancias comerciales multi-tenant.
3.  **Portabilidad y paridad de entornos:** Que el código fuente y las configuraciones del backend NestJS no sufran alteraciones estructurales al cambiar de una instalación local a una en la nube.

## Decisión
Adoptaremos una **Arquitectura Híbrida y Cloud‑Native basada en Contenedores** utilizando **Amazon Web Services (AWS)** como el proveedor cloud de referencia para la escalabilidad comercial de Activa360. 

Aseguraremos una paridad absoluta de componentes por capas entre el entorno local (On-Premise) y la arquitectura en la nube (AWS), permitiendo que la transición sea una simple configuración de infraestructura como código (IaC) sin impacto en la capa del Dominio ni en los Adaptadores de la arquitectura hexagonal.

### Mapeo y Paridad de Componentes por Capas

| Capa Arquitectónica | Componente On-Premise (UMSS) | Servicio Cloud Target (AWS) | Justificación e Invariantes del Mapeo |
| :--- | :--- | :--- | :--- |
| **Presentación (Web)** | Servidor Nginx (React SPA estático) | **Amazon S3 + Amazon CloudFront** | Hospedaje de archivos estáticos HTML/JS/CSS con distribución global, baja latencia y descarga de carga HTTP directa del backend. |
| **API Gateway / Ruteo** | Nginx Reverse Proxy + Gateway | **Amazon API Gateway** | Enrutamiento de endpoints HTTP, limitación de tasa (rate-limiting), validación de firmas y cabeceras JWT antes de golpear los servicios. |
| **Seguridad y Roles** | Active Directory / LDAP UMSS | **AWS Cognito / IAM (IDP)** | Gestión federada de identidades de custodios, directivos e inventariadores con control de acceso basado en roles (RBAC). |
| **Lógica Backend / Sagas** | Microservicios en Contenedores Docker | **Amazon ECS + AWS Fargate** | Ejecución serverless de contenedores que albergan el backend NestJS (Core y Sync Engine). Garantiza cero gestión de servidores EC2. |
| **Base de Datos Core** | PostgreSQL Server Local (Clúster) | **Amazon RDS para PostgreSQL** | Persistencia relacional ACID y soporte relacional completo compatible con TypeORM sin cambios de dialecto SQL. |
| **Mensajería y Sync Colas**| Clúster de Redis Server local | **Amazon ElastiCache para Redis** | Colas en memoria asíncronas para la reconciliación y resolución de conflictos de inventario offline (Sync Engine). |
| **Almacenamiento (Actas)** | Servidor de Objetos MinIO local | **Amazon S3 (Simple Storage Service)** | Almacenamiento persistente, duradero e inmutable para las actas de asignación y bajas SABS en PDF. MinIO usa API idéntica a S3. |
| **Monitoreo y Observabilidad**| Winston Logs + Prometheus / Grafana| **Amazon CloudWatch + AWS X-Ray** | Trazabilidad distribuida para monitorear el rendimiento de los endpoints y los jobs de sincronización por lotes. |

## Consecuencias

*   **Positivas:**
    *   **Portabilidad Extrema:** Al usar contenedores Docker y servicios compatibles en almacenamiento (MinIO local tiene una API 100% compatible con Amazon S3), el código de Node/NestJS no requiere cambios al desplegarse On-Premise en la UMSS o en la nube de AWS para un municipio cliente.
    *   **Elasticidad Comercial:** Permite lanzar la versión SaaS multi-tenant en AWS de forma ágil y automatizada a través de Terraform.
    *   **Cumplimiento de Rúbrica:** Garantiza el mapeo por capas en AWS y la justificación requerida para alcanzar el nivel de excelencia en la evaluación de la Defensa Final.
*   **Negativas / Trade-offs:**
    *   **Doble curva en DevOps:** Exige que el equipo domine tanto el orquestador local (ej. Docker Compose o clúster de Kubernetes institucional) como la infraestructura en AWS (ECS, RDS, API Gateway).
    *   **Costo de Transferencia:** La sincronización de grandes volúmenes de escaneos desde la aplicación móvil hacia la base de datos cloud de AWS RDS puede generar costes de transferencia de datos de red, aunque mitigados por el Sync Engine por lotes (batch operations).
