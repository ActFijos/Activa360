# Business Requirements Document (BRD) – Activos Fijos

**Propósito del BRD**: formalizar las **necesidades y restricciones de negocio** que justifican la existencia del producto, *independientemente de la solución técnica*. Responde a **"¿qué necesita el negocio y por qué?"**.

**Alcance en este módulo**: en este Módulo 4, **todos los grupos entregan BRD** como primer documento de la cadena `BRD → MRD → PRD → FSD → DTI`. El BRD captura la visión del *sponsor*; el MRD profundizará luego la mirada de mercado y competencia.

El BRD debe alinearse al marco conceptual visto en S02 (método científico aplicado al software): aquí formulamos la **etapa "Problema"** —qué dolor real resolvemos y por qué importa— antes de pasar a la abstracción de producto en MRD/PRD.

---

## 0. Metadatos

| Campo | Valor |
| :---- | :---- |
| Producto | Activa360 – Sistema Inteligente de Gestión de Activos Fijos |
| Grupo | Grupo 3 (Activos Fijos) |
| Versión | v1.0.0 |
| Fecha | 27/05/2026 |
| Sponsor de negocio | Armando Ríos (MAE) + Roger Valenzuela (Jefe de Activos Fijos UMSS) |
| Stakeholders | Jefe de Activos Fijos, Subjefes de Activos, Inventariadores, Funcionarios y docentes (custodios), Autoridades institucionales (MAE), Entidades reguladoras |
| Autores | Equipo de Desarrollo Grupo 3 |
| Revisores | Docente + 1 grupo par |
| Estado | Final |
| Insumo del Módulo Anterior (M2 UI/UX) | docs/ux/M2_UI_UX_Activa360.pdf |
| Prompts utilizados | docs/PROMPT_MAPPING.md |

## 1. Resumen ejecutivo

Activa360 es una solución tecnológica orientada a transformar la gestión de activos fijos en instituciones públicas, abordando la brecha existente entre los registros contables y la realidad física de los bienes.

El sistema propone una gestión inteligente basada en trazabilidad en tiempo real, movilidad y automatización, permitiendo eliminar los denominados "activos fantasmas" y mejorar significativamente la eficiencia operativa, el control institucional y la toma de decisiones.

Inicialmente concebido para su implementación en la Universidad Mayor de San Simón (UMSS), Activa360 tiene el potencial de escalar como una solución GovTech para otras instituciones públicas.

**Métricas clave de éxito:**
- % de coincidencia entre inventario físico y sistema
- Reducción de tiempo en inventarios
- Disminución de errores en registros

**Llamada a la acción:** Se requiere aprobación del sponsor y asignación de recursos para iniciar la fase de desarrollo.

## 2. Contexto del negocio

- **Organización**: Universidad Mayor de San Simón (UMSS)
- **Unidad impactada**: Dirección de Activos Fijos / Unidad de Patrimonio
- **Proceso(s) de negocio afectado(s)**: Inventario físico, registro de activos, control patrimonial, auditorías
- **Estrategia de la organización** que justifica el proyecto: Modernización tecnológica institucional y cumplimiento normativo SABS

## 3. Problema y oportunidad de negocio

### 3.1 Problema

Desconexión entre inventario físico y registros digitales, procesos manuales propensos a errores, falta de trazabilidad en tiempo real, riesgos en auditorías por incumplimiento normativo, e interfaces complejas y poco intuitivas.

La gestión actual de activos fijos presenta las siguientes deficiencias:
- **Desconexión entre inventario físico y registros digitales**: Los registros contables no reflejan la realidad física de los bienes
- **Procesos manuales propensos a errores**: Alta dependencia de hojas de cálculo y registros en papel
- **Falta de trazabilidad en tiempo real**: Imposible conocer la ubicación actual de un activo
- **Riesgos en auditorías por incumplimiento normativo**: Dificultad para demostrar cumplimiento SABS
- **Interfaces complejas y poco intuitivas**: Sistemas legados con mala experiencia de usuario

### 3.2 Oportunidad

- **Valor económico estimado**: Reducción de pérdidas de activos estimado en X% anual
- **Valor estratégico / reputacional**: Cumplimiento normativo y mejora en control institucional
- **Ventana de oportunidad**: Demanda creciente de transformación digital en sector público

### 3.3 Evidencia de Continuous Discovery

- **Documento de Discovery**: docs/discovery/discovery_v1.0.md
- **Entrevistas realizadas**: 12 entrevistas con Jefe de Activos, 3 Inventariadores de la UMSS, 2 Técnicos de TI y 6 Custodios Académicos.
- **Hipótesis principales validadas / refutadas**: Se validó que el 90% de los inventariadores prefiere usar la app offline por velocidad en almacenes, y se refutó que dependieran de conectividad Wi-Fi constante (80% reportó zonas sin cobertura).
- **Artefactos M2 (UI/UX)**: Wireframes en Balsamiq y Mockups de Alta Fidelidad en Figma correspondientes a la consigna M2.
- **Próxima cadencia de Discovery**: quincenal durante la iteración del producto.

## 4. Usuarios objetivo / Personas clave

### 4.1 Persona principal

| Atributo | Valor |
| :---- | :---- |
| Nombre / rol | Jefe de Activos Fijos |
| Contexto | Responsable del control patrimonial institucional, realiza supervisión de inventarios y reporting a autoridades |
| *Jobs‑to‑be‑done* | Supervisar inventario, generar reportes de auditoría, mantener cumplimiento normativo, localizar activos rápidamente |
| Dolores principales | Desconocimiento de ubicación real de activos, auditorías con hallazgos negativos, tiempo excesivo en conteos manuales |
| Ganancia esperado | Visibilidad total de activos, reportes instantáneos, cumplimiento normativo automático |

### 4.2 Persona secundaria

| Atributo | Valor |
| :---- | :---- |
| Nombre / rol | Inventariador / Custodio de activos |
| Contexto | Personal de campo que realiza el conteo físico y actualización de estado de activos |
| *Jobs‑to‑be‑done* | Registrar activos encontrados, actualizar ubicación, reportar estados, escanear códigos QR |
| Dolores principales | Procesos manuales con papel, impossibility de trabajar offline, pérdida de registros |
| Ganancia esperada | Aplicación móvil intuitiva, trabajo offline, sincronización automática |

## 5. Propuesta de valor

| Eje | Contenido |
| :---- | :---- |
| **Para quién** (cliente / usuario principal) | Instituciones públicas (inicialmente UMSS) responsables de gestión de activos fijos |
| **Que necesita** (job‑to‑be‑done) | Mantener trazabilidad en tiempo real de activos, cumplir normativa SABS, reducir activos fantasmas |
| **Nuestra propuesta es** (producto / servicio) | Activa360 – Sistema Inteligente de Gestión de Activos Fijos con tecnología QR y app móvil offline |
| **Que le aporta** (pain relievers + gain creators) | • Eliminación de activos fantasmas<br>• Gestión de activos en tiempo real desde campo<br>• Trazabilidad completa (ubicación, responsable, historial)<br>• Automatización de cumplimiento normativo SABS<br>• Dashboards inteligentes para toma de decisiones |
| **A diferencia de** (alternativa actual) | Sistemas actuales (VSIAF/SIAF, SAF WEB) son manuales, sin movilidad, interfaces complejas, reportes estáticos |
| **Nuestro diferencial es** (unique value) | Tecnología QR, aplicación móvil con modo offline, dashboards inteligentes, automatización normativa – diseñado para contexto boliviano |

## 6. Panorama competitivo (resumen)

| Competidor / alternativa | Tipo (directo / indirecto / do‑nothing) | Fortaleza percibida | Debilidad percibida |
| :---- | :---- | :---- | :---- |
| VSIAF / SIAF | do‑nothing | Conocido por usuarios, integrado con finanzas | Solo registro contable, sin trazabilidad física |
| SAF WEB | indirecto | Funcionalidades contables | Sin movilidad, interfaces complejas |
| Soluciones internacionales | indirecto | UX moderna, funcionalidades completas | No adaptados a normativa SABS Bolivia, costo elevado |
| Activa360 | directo | Tecnología QR, app offline, automatización SABS | Solución nueva sin historial |

Nota: este resumen se complementa con la sección de competencia del MRD (`docs/mrd/MRD_v0.1.md`).

## 7. Business Model Canvas

| Bloque | Mínimo 3 elementos concretos |
| :---- | :---- |
| 1. Segmentos de clientes | Universidades públicas / Instituciones públicas Bolivia / Entidades del gobierno central |
| 2. Propuesta de valor | Trazabilidad en tiempo real / Eliminación de activos fantasmas / Cumplimiento normativo SABS automático / App móvil offline |
| 3. Canales | Ventas directas / Licitaciones públicas / Partners tecnológicos / Recomendaciones |
| 4. Relación con clientes | Soporte técnico dedicado / Capacitación in-situ / Actualizaciones periódicas |
| 5. Fuentes de ingresos | Licencia de software / Implementación / Mantenimiento anual / Capacitaciones |
| 6. Recursos clave | Equipo de desarrollo / Equipo de implementación / Base de conocimiento normativo SABS |
| 7. Actividades clave | Desarrollo de software / Implementación / Capacitación / Soporte / Actualizaciones normativas |
| 8. Socios clave | Empresas de hardware (códigos QR) / Instituciones públicas / Partners de integración |
| 9. Estructura de costos | Desarrollo software / Servidores cloud / Equipo humano / Capacitaciones / Licencias |

## 8. Métricas clave de éxito (North Star + apoyo)

| ID | KPI | North Star? | Línea base | Meta | Horizonte | Fuente del dato |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| KPI-01 | % de coincidencia entre inventario físico y sistema | Sí | 68% | ≥ 95% | Q4 2026 | Sistema Activa360 |
| KPI-02 | Reducción de tiempo en inventarios | No | 240 horas | -50% | Q4 2026 | Registros internos |
| KPI-03 | Disminución de errores en registros | No | 12% error | -80% | Q4 2026 | Sistema |
| KPI-04 | Tiempo de localización de activos | No | 45 min prom. | < 1 min | Q4 2026 | Sistema |
| KPI-05 | Nivel de adopción del sistema por usuarios | No | 15% (Excel) | ≥ 80% | Q4 2026 | Logs del sistema |

## 9. Objetivos de negocio (SMART)

| ID | Objetivo | Métrica | Línea base | Meta | Horizonte |
| :---- | :---- | :---- | :---- | :---- | :---- |
| BO-01 | Eliminar activos fantasmas | % de activos sin localizar | 15% promedio | < 2% | Q4 2026 |
| BO-02 | Reducir tiempo de inventario físico | Horas hombre | 120 horas/año | ≤ 60 horas/año | Q4 2026 |
| BO-03 | Mejorar cumplimiento normativo SABS | % de requisitos automatizados | 40% | ≥ 90% | Q4 2026 |
| BO-04 | Reducir errores en registros de activos | Tasa de error | 8% | < 1% | Q4 2026 |

## 10. Stakeholders y roles (modelo RACI)

| Stakeholder | Interés | R / A / C / I |
| :---- | :---- | :---- |
| Sponsor (MAE UMSS) | Estratégico | A |
| Jefe de Activos Fijos | Operativo | R |
| Subjefes de Activos | Operativo | C |
| Inventariadores | Ejecución | R |
| Funcionarios y docentes (custodios) | Uso diario | C |
| Dirección de Finanzas | Integración contable | C |
| Unidad de TI | Infraestructura | C |
| Entidades reguladoras | Cumplimiento | I |

## 11. Requerimientos de negocio

| ID | Requerimiento de negocio | Prioridad (MoSCoW) | Justificación | Métrica de aceptación |
| :---- | :---- | :---- | :---- | :---- |
| BR-001 | Permitir registro y seguimiento de activos con código QR único | Must | Trazabilidad básica del sistema | 100% de activos con código QR registrado |
| BR-002 | Sincronización de datos en modo offline | Must | Inventariadores trabajan sin conectividad | App funciona 100% offline, sincroniza al reconectar |
| BR-003 | Generar reportes de inventario automáticamente | Must | Reducir tiempo de generación de reportes | Reportes disponibles en < 5 segundos |
| BR-004 | Notificar activos sin localizar por período configurable | Must | Identificar activos fantasma | Notificaciones enviadas dentro de 24h |
| BR-005 | Integrar con sistema contable institucional | Should | Mantener consistencia contable | Sincronización diaria exitosa |
| BR-006 | Control de bajas de activos según normativa SABS | Must | Cumplimiento normativo | workflow de baja documentado y ejecutado |
| BR-007 | Historial completo de movimientos por activo | Must | Trazabilidad total | Registro de toda la vida del activo accesible |
| BR-008 | Dashboard con indicadores clave para directivos | Should | Soporte a toma de decisiones | Dashboard actualizado en tiempo real |
| BR-009 | Gestión de custodios y responsabilidades | Should | Asignación clara de responsabilidad | Cada activo tiene custodio asignado |

## 12. Reglas de negocio y políticas

| ID | Regla | Tipo | Origen |
| :---- | :---- | :---- | :---- |
| RB-01 | Todo activo debe tener código QR único vinculado al sistema | política | Procedimiento interno |
| RB-02 | Baja de activo requiere autorización del nivel correspondiente | normativa | Manual SABS |
| RB-03 | Inventario físico debe realizarse al menos 1 vez al año | normativa | Resolución universitaria |
| RB-04 | Cambio de custodio debe ser registrado en el sistema | política | Control interno |
| RB-05 | Activo sin localizar por 12 meses se considera activo fantasma | normativa | Interpretación SABS |

## 13. Supuestos, restricciones y dependencias

- **Supuestos**: 
  - Disponibilidad de datos institucionales actualizados
  - Acceso a dispositivos móviles para inventariadores
  - Apoyo institucional para la implementación
  - Conectividad básica en oficinas para sincronización
  
- **Restricciones**:
  - Cumplimiento de normativa SABS (Sistema de Administración de Bienes y Servicios)
  - Limitaciones presupuestarias definidas por TUCA
  - Infraestructura tecnológica existente (servidores, red)
  - Plazo del proyecto definido por calendario académico
  
- **Dependencias**:
  - Integración con sistemas contables (VSIAF/SIAF)
  - Disponibilidad de infraestructura TIC de la UMSS
  - Validación normativa por parte de la Dirección de Bienes
  - Capacitación de usuarios para adopción

## 14. Alcance de negocio

### 14.1 En alcance

- Gestión de activos fijos de la UMSS (bienes muebles)
- Registro y trazabilidad mediante códigos QR
- Aplicación móvil para inventario en campo
- Dashboard de indicadores para directivos
- Integración básica con sistema contable
- Cumplimiento normativo SABS para bajas y reportes

### 14.2 Fuera de alcance

- Gestión de bienes inmuebles (terrenos, edificios)
- Activos de otras instituciones (sin expansión inicial)
- Integración con sistemas de recursos humanos
- Gestión de mantenimiento de activos
- Activos intangibles o propiedad intelectual

## 15. Beneficios esperados y business case resumido

| Tipo | Año 1 | Año 2 | Año 3 |
| :---- | :---- | :---- | :---- |
| Ahorro operativo (reducción pérdidas + tiempo) | Bs. 105,000 | Bs. 126,000 | Bs. 140,000 |
| Ingresos adicionales | Bs. 0 | Bs. 0 | Bs. 0 |
| Inversión (CAPEX) | Bs. 84,000 | Bs. 0 | Bs. 14,000 |
| Costo operación (OPEX) | Bs. 17,500 | Bs. 17,500 | Bs. 17,500 |
| **Flujo de caja neto** | Bs. 3,500 | Bs. 108,500 | Bs. 108,500 |
| **VAN (tasa 10%)** | **Bs. 163,030** | | |
| **TIR** | **52%** | | |

*Nota: Valores estimados basados en la recuperación de activos fantasmas y un ahorro considerable en horas-hombre durante la toma de inventarios institucionales.*

## 16. Riesgos de negocio

| Riesgo | Probabilidad | Impacto | Mitigación | Responsable |
| :---- | :---- | :---- | :---- | :---- |
| Resistencia al cambio | Alta | Alto | Capacitación, comunicación, gestión de cambio | PM |
| Baja adopción por usuarios | Media | Alto | Diseño UX intuitivo, incentivos, soporte | Equipo UX |
| Problemas de integración con sistemas existentes | Media | Medio | Pruebas tempranas, documentación de APIs | Equipo técnico |
| Incumplimiento de plazos | Media | Medio | Metodología ágil, sprints cortos | PM |
| Cambios normativos SABS | Baja | Medio | Monitoreo de actualizaciones, arquitectura flexible | Arquitecto |

## 17. Criterios de éxito del proyecto de negocio

- Cumplimiento de ≥ 80% de los objetivos SMART
- *Business case* positivo al año 1
- Satisfacción del sponsor ≥ 4/5
- ≥ 95% de coincidencia inventario físico-sistema
- Adopción por ≥ 80% de usuarios objetivo

## 18. Trazabilidad a documentos hijos

| BRD ID | MRD relacionado | PRD relacionado | Caso de uso FSD |
| :---- | :---- | :---- | :---- |
| BR-001 | MRD-N-01 | PRD-REQ-001 | FSD-UC-001 |
| BR-002 | MRD-N-02 | PRD-REQ-002 | FSD-UC-002 |
| BR-003 | - | PRD-REQ-007 | FSD-UC-006 |
| BR-004 | - | PRD-REQ-007 | FSD-UC-009 |
| BR-005 | - | PRD-REQ-009 | FSD-UC-007 |
| BR-006 | MRD-N-04 | PRD-REQ-006 | FSD-UC-003 |
| BR-007 | MRD-N-03 | PRD-REQ-004 | FSD-UC-001 |
| BR-008 | MRD-N-05 | PRD-REQ-008 | FSD-UC-008 |
| BR-009 | - | PRD-REQ-005 | FSD-UC-004 |

*Nota: Completar trazabilidad al crear documentos hijos*

## 19. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| :---- | :---- | :---- | :---- |
| Sponsor | | | |
| PM | | | |
| Arquitecto | | | |

## 20. Registro de cambios

| Versión | Fecha | Autor | Cambio |
| :---- | :---- | :---- | :---- |
| v0.1 | 14/05/2026 | Grupo 3 | Versión inicial basada en M4 BRD Activos Fijos.docx |
| v1.0.0 | 27/05/2026 | Grupo 3 | Versión final pulida y alineada para la Defensa Final |

## 21. Anexo opcional — PR‑FAQ Amazon‑style (Working Backwards)

*Pendiente de desarrollar si el equipo lo considera necesario*

---

## Checklist mínimo de entrega

- [x] **Resumen ejecutivo** de ½ página con problema, propuesta, valor y métricas
- [x] Problema de negocio con evidencia cuantitativa
- [x] **1–2 personas / usuarios objetivo** caracterizadas (JTBD, dolores, ganancias)
- [x] **Propuesta de valor** explícita (formato VPC)
- [x] **Panorama competitivo resumen** con ≥ 3 alternativas (incluyendo *do‑nothing*)
- [x] **Business Model Canvas** con los 9 bloques poblados, **≥ 3 elementos por bloque**
- [x] **Métricas clave de éxito**: ≥ 1 *North Star* + 2 KPIs de apoyo, con meta y horizonte
- [x] ≥ 3 objetivos de negocio SMART
- [x] Matriz RACI completa
- [x] ≥ 8 requerimientos de negocio priorizados (MoSCoW)
- [x] Reglas, restricciones, supuestos y dependencias explícitos
- [x] *Business case* cuantitativo (aunque sea estimado) – Completado
- [x] Trazabilidad a MRD/PRD iniciada