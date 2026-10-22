# Hallazgo de Seguridad: H-006 — IDOR en Consulta y Asignación de Bienes Fijos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-006` (Relacionado con `RT-004`) |
| **Título del Hallazgo:** | Manipulación de Identificadores de Asignación para Ver Historias de Custodios Ajenos |
| **Categoría:** | `RBAC / Control de Acceso Horizontal` |
| **Componente Afectado:** | Backend NestJS (`AsignacionesController` / Endpoint `/api/asignaciones/{id}`) |
| **Clasificación STRIDE:** | `Information Disclosure` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A01:2021 - Broken Access Control / CWE-639` |
| **Actor Atacante (Persona):** | `ATK-USER` (Usuario emisor de consulta) |
| **Severidad Estimada:** | **MEDIO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Un usuario con permisos de consulta puede ver actas y registros de asignación pertenecientes a otros funcionarios modificando la clave primaria del registro de asignación en las peticiones HTTP.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N` (Puntaje Base: **4.3 - MEDIO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Visualización de nombres de custodios e historiales de entrega | `5` |
| **Reproducibility (Reproducibilidad)** | Inmediata alterando el ID de asignación | `9` |
| **Exploitability (Explotabilidad)** | Fácil mediante peticiones GET | `9` |
| **Affected Users (Usuarios Afectados)** | Registros de custodios institucionales | `5` |
| **Discoverability (Descubrimiento)** | Fácil por patrones de IDs incrementales | `8` |
| **Promedio DREAD:** | **7.2** | **MEDIO** |

---

## 3. Descripción Técnica y Causa Raíz
El repositorio de asignaciones ejecutaba consultas directas sin verificar el identificador del custodio solicitante ni su nivel de autorización.

---

## 4. Prueba de Concepto (PoC)

```bash
curl -X GET "http://localhost:3000/api/asignaciones/ASIG-99482" \
  -H "Authorization: Bearer $TOKEN_USER_CIENCIAS"
```

---

## 5. Plan de Remedación
Verificar a nivel de servicio que el `custodianId` coincide con el `sub` del JWT o que el usuario posee rol administrativo.

```diff
+ if (asignacion.custodianId !== user.id && !user.roles.includes('ADMIN-ACTIVOS')) {
+   throw new ForbiddenException();
+ }
```

---

## 6. Prueba Automatizada de Regresión

```typescript
it('Debe retornar 403 al intentar acceder a un acta de asignación ajena', async () => {
  await request(app.getHttpServer())
    .get('/api/asignaciones/ASIG-99482')
    .set('Authorization', `Bearer ${tokenCiencias}`)
    .expect(403);
});
```
