# Market Requirements Document (MRD) – Activa360

**Propósito del MRD**: describir **el mercado, los usuarios y la oportunidad comercial** que justifican la construcción del producto. Responde a **"¿qué pide el mercado y por qué este producto ganará?"**.

Complementa al BRD (visión interna del negocio) y antecede al PRD (qué debe hacer el producto). Audiencia típica: *Product Management, Marketing, Ventas, Sponsor*.

---

## 0. Metadatos

| Campo | Valor |
| :---- | :---- |
| Producto | Activa360 – Sistema Inteligente de Gestión de Activos Fijos |
| Grupo | Grupo 3 (Activos Fijos) |
| Versión | v1.0.0 |
| Fecha | 27/05/2026 |
| Product Manager / Autor | Equipo Activa360 |
| Revisores | Docente + stakeholders |
| Estado | Aprobado |
| Relación con BRD | BRD_Activos_Fijos.md v1.0.0 |

## 1. Resumen ejecutivo

Activa360 es una solución GovTech orientada a transformar la gestión patrimonial en instituciones públicas bolivianas y latinoamericanas. En el sector público, la falta de conciliación entre el registro contable y la existencia física de los activos fijos genera pérdidas millonarias, riesgos de auditoría e ineficiencias operativas crónicas. 

Nuestro producto aborda este problema ofreciendo una plataforma de trazabilidad en tiempo real apalancada por tecnología móvil *offline-first* y escaneo QR. Nos diferenciamos de los sistemas legacy (como el SIAF o SAF WEB) y de las hojas de cálculo tradicionales por nuestra capacidad de operar en campo sin internet, automatizando la tediosa normativa SABS (Decreto Supremo N° 0181) sin requerir re-transcripción de datos. La oportunidad de mercado inicial (SOM) se centra en la UMSS y gobiernos municipales de Cochabamba, proyectando un modelo SaaS B2G (Business-to-Government) para escalar nacionalmente.

## 2. Visión del producto

Para las instituciones públicas bolivianas, que hoy enfrentan auditorías fallidas por "activos fantasmas", Activa360 es una plataforma patrimonial que reduce el tiempo de inventariación en 50% y garantiza el cumplimiento normativo SABS automáticamente.

## 3. Análisis de mercado

### 3.1 Tamaño de mercado

| Métrica | Valor | Fuente |
| :---- | :---- | :---- |
| TAM (*Total Addressable Market*) | $450 Millones USD | Mercado GovTech SaaS en Sudamérica para control patrimonial. |
| SAM (*Serviceable Addressable Market*) | $12 Millones USD | Gasto anual en modernización de gestión pública y auditoría de entidades en Bolivia. |
| SOM (*Serviceable Obtainable Market*) | $500,000 USD | Entidades autónomas (UMSS) y 47 municipios del departamento de Cochabamba. |

### 3.2 Tendencias del sector

- **Tendencia 1:** Digitalización obligatoria (Gobierno Electrónico) y eliminación gradual del papel en trámites del Estado.
- **Tendencia 2:** Adopción de tecnologías móviles offline para operaciones de campo en zonas con baja conectividad.
- **Tendencia 3:** Exigencia de transparencia y control anticorrupción por parte de organismos multilaterales (BID, CAF) en financiamientos.

### 3.3 Factores regulatorios y de cumplimiento

- **Nacional:** Normas Básicas del Sistema de Administración de Bienes y Servicios (NB-SABS) - Decreto Supremo N° 0181.
- **Auditoría:** Normas de Auditoría Gubernamental emitidas por la Contraloría General del Estado.

### 3.4 Cadencia de Continuous Discovery

| Aspecto | Valor |
| :---- | :---- |
| Cadencia de entrevistas | Quincenal |
| Usuarios contactados por ciclo | 3 (Jefes de Activos, Inventariadores, Auditores) |
| Formato de hipótesis | *Cuando `<situación>`, espero `<resultado>`, porque `<razón>`* |
| Output del track | Validaciones que actualizan §4 y §12 de este MRD. |

## 4. Segmentación y *personas*

### 4.1 Segmentos de clientes

| Segmento | Tamaño | Necesidad principal | Disposición a pagar | Origen M2 |
| :---- | :---- | :---- | :---- | :---- |
| Universidades Públicas | 11 en Bolivia | Trazabilidad de miles de equipos (PCs, laboratorios) | Presupuesto IDH / Matrículas | Jefe de Activos |
| Gobiernos Municipales | 339 en Bolivia | Control de activos dispersos en centros de salud y escuelas | Presupuesto anual de funcionamiento | MAE |

### 4.2 Personas

#### Persona 1 – Roger Valenzuela (Jefe de Activos Fijos)

- **Origen M2**: `M2. Consigna de Trabajo Final Activa360ult.pdf`
- **Rol**: Jefe del Departamento de Activos Fijos (Mando Medio).
- **Demografía**: 50 años, 20 años de experiencia técnica-administrativa en el sector público.
- **Objetivos**: Aprobar auditorías anuales sin observaciones; saber exactamente dónde está cada computadora o vehículo.
- **Dolores actuales**: Pasa semanas consolidando listas en Excel. Sus inventariadores pierden tiempo anotando a mano y luego transcribiendo. No tiene visibilidad en tiempo real.
- **Comportamiento digital**: Usa PC de escritorio para trabajo pesado, smartphone para WhatsApp y correo. Reticente a sistemas "complejos".
- **Frase representativa**: *"Cada auditoría es una pesadilla porque la contabilidad dice una cosa y el inventario físico dice otra."*

#### Persona 2 – Lic. Armando Ríos (MAE - Rector / Alcalde)

- **Rol**: Máxima Autoridad Ejecutiva.
- **Demografía**: 55+ años, perfil político-ejecutivo.
- **Objetivos**: Transparencia de gestión, optimización del presupuesto (no comprar equipos que ya existen en almacén).
- **Dolores actuales**: Firma actas de baja sin saber el contexto real. Descubre pérdidas de patrimonio meses después de sucedidas.
- **Comportamiento digital**: Consume información consolidada en iPad/Smartphone. No usa sistemas operativos, solo dashboards.
- **Frase representativa**: *"Necesito indicadores claros de nuestro patrimonio para justificar el presupuesto del próximo año al Ministerio."*

## 5. *Jobs‑to‑be‑Done*

| JTBD ID | Cuando… | Quiero… | Para poder… |
| :---- | :---- | :---- | :---- |
| JTBD-01 | hay cierre de gestión anual | escanear bienes rápidamente sin internet | no paralizar las actividades administrativas por semanas |
| JTBD-02 | detecto un activo arruinado | iniciar el trámite de baja SABS desde el celular | deshacerme del bien sin perder meses en burocracia de papel |
| JTBD-03 | el Ministerio pide un reporte de patrimonio | generar un reporte actualizado a la fecha con un clic | responder inmediatamente sin depender de conteos manuales de mi equipo |

## 6. Análisis competitivo

### 6.1 Tabla comparativa

| Criterio | Nuestro producto (Activa360) | Microsoft Excel / Papel | SAF WEB (Estado) | SIGEP / SIAF |
| :---- | :---- | :---- | :---- | :---- |
| App Móvil Offline | Sí (Nativo) | No | No | No |
| Automatización SABS | Sí (Específico) | No | Parcial | Limitado a Contabilidad |
| Facilidad de uso | Alta (Mobile UI) | Alta pero sin control | Baja (Interfaces de los 90s) | Baja |
| Costo | Suscripción SaaS / Licencia | Gratis (hundido) | Gratis (Obligatorio Estado) | Gratis (Obligatorio) |
| Reportes en Tiempo Real| Sí (Dashboards web) | Requiere conciliación manual | Retrasados | Contables, no físicos |

### 6.2 *Positioning statement*

Para las **entidades gubernamentales bolivianas**, que sufren de **discrepancias crónicas entre contabilidad e inventario**, nuestro **Activa360** es un **Sistema Inteligente de Gestión Patrimonial** que **garantiza trazabilidad en campo operando sin internet**, a diferencia de **los sistemas contables estatales** que **son ciegos a la realidad física de los activos**.

### 6.3 Ventaja competitiva sostenible

- **Especialización Operativa Offline:** Mientras los sistemas del estado exigen conexión VPN constante, Activa360 se adapta a las condiciones reales de infraestructura boliviana (sótanos sin señal).

## 7. Propuesta de valor

### 7.1 *Value proposition canvas* resumido

| Gains | Pains | Gains relievers | Pain relievers | Products & services |
| :---- | :---- | :---- | :---- | :---- |
| Control total patrimonial | Auditorías observadas | Dashboards en tiempo real | Generación automática de Actas SABS | App Móvil Offline |
| Decisiones rápidas | Doble digitación propensa a error | Trazabilidad por código QR | Sincronización transparente DB | Panel Web de Administración |

## 8. Pricing y modelo de negocio

- **Modelo**: SaaS B2G (Business-to-Government) u On-Premise Enterprise según requerimiento institucional.
- **Estructura de precios propuesta**: Licencia anual basada en el volumen de activos gestionados (Ej. Tier 1: hasta 10,000 activos, Tier 2: hasta 50,000 activos).
- **Servicios adicionales**: Capacitación *on-site*, provisión de impresoras de etiquetas QR como Add-ons.

## 9. *Go‑to‑market*

### 9.1 Canales de adquisición

- **Canal directo**: Ventas consultivas B2G, reuniones con rectores, alcaldes y consejos municipales.
- **Partners**: Consultoras de auditoría gubernamental que pueden recomendar la herramienta para sanear las entidades.

### 9.2 Estrategia de lanzamiento

- **Pre‑launch**: Piloto controlado gratuito en una facultad específica de la UMSS (ej. FCyT).
- **Launch**: Presentación del caso de éxito UMSS en congresos de universidades públicas (CEUB) y AMDECO.
- **Post‑launch**: Modelo de retención asegurando integraciones gratuitas con futuras actualizaciones del SIGEP estatal.

### 9.3 Funnel AARRR inicial

| Etapa | Métrica | Meta (Año 1) |
| :---- | :---- | :---- |
| Acquisition | Instituciones contactadas | 20 |
| Activation | Pilotos implementados | 3 |
| Retention | Tasa de renovación anual | 100% |
| Revenue | Ingresos Recurrentes Anuales (ARR) | $30,000 USD |
| Referral | Instituciones referidas por otras | 2 nuevas |

## 10. Métricas de éxito del producto

- **North Star Metric**: % de coincidencia entre inventario físico y sistema (Meta: ≥ 95%).
- **KPIs secundarios**:
  1. Tiempo promedio de inventario anual (Meta: Reducción del 50%).
  2. Número de activos procesados offline (Meta: > 5,000 al mes).
  3. Tiempo de emisión de acta de baja (Meta: < 24 horas).

## 11. Requerimientos de mercado (alto nivel)

| ID | Requerimiento | Prioridad | Justificación |
| :---- | :---- | :---- | :---- |
| MRD-N-01 | Soporte estricto para etiquetado QR. | Must | El mercado repudia el tipeo manual. |
| MRD-N-02 | Modo de operación en zonas sin internet (Offline). | Must | 40% de almacenes no tienen Wi-Fi. |
| MRD-N-03 | Localización de bienes por nombre, código o custodio. | Must | Exigido para respuestas rápidas de auditoría. |
| MRD-N-04 | Flujos de baja apegados a DS 0181. | Must | Requerimiento legal para cualquier entidad pública. |
| MRD-N-05 | Dashboard analítico para autoridades. | Must | La MAE no usa tablas, usa gráficos. |

## 12. Supuestos e hipótesis a validar

| ID | Hipótesis | Cómo validar | Criterio de éxito |
| :---- | :---- | :---- | :---- |
| H1 | Los inventariadores preferirán escanear QR antes que leer planillas físicas. | Prueba en piloto (A/B) | ≥ 80% adopción voluntaria. |
| H2 | Las entidades están dispuestas a pagar licenciamiento anual. | Consultas de presupuesto a DAFs | ≥ 2 cartas de intención. |
| H3 | WatermelonDB/SQLite soportará 10,000 registros offline sin crashear. | Load testing en móvil | Sincronización < 10 segundos. |

## 13. Riesgos de mercado

| Riesgo | Prob. | Impacto | Mitigación |
| :---- | :---- | :---- | :---- |
| El Gobierno lanza su propia App Móvil conectada al SIAF. | Baja | Alto | Mantener la UX/UI muy superior; enfoque en valor agregado de análisis. |
| Universidades rechazan el modelo SaaS por reglas presupuestarias. | Media | Medio | Ofrecer modelo de licenciamiento On-Premise con soporte anual. |

## 14. Trazabilidad

| MRD ID | BRD ID | PRD ID |
| :---- | :---- | :---- |
| MRD-N-01 | BR-001 | PRD-REQ-001 |
| MRD-N-02 | BR-002 | PRD-REQ-002 |
| MRD-N-03 | BR-007 | PRD-REQ-003 |
| MRD-N-04 | BR-006 | PRD-REQ-006 |
| MRD-N-05 | BR-008 | PRD-REQ-008 |

## 15. Anexos

- Análisis normativo del DS 0181 (SABS).
- Entrevistas transcritas de Jefes de Activos Fijos UMSS.

## 16. Registro de cambios

| Versión | Fecha | Autor | Cambio |
| :---- | :---- | :---- | :---- |
| v0.1 | 14/05/2026 | Equipo | Versión inicial completando la plantilla estándar para GovTech. |
