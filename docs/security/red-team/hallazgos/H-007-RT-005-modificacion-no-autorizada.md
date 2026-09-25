# Hallazgo de Seguridad: H-007 — Modificación No Autorizada de Propiedades de Activos

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-007` (Relacionado con `RT-005`) |
| **Título del Hallazgo:** | Edición de Atributos de Activos Fijos por Usuarios con Rol de Consulta |
| **Categoría:** | `RBAC / Escalada de Privilegios Horizontal/Vertical` |
| **Componente Afectado:** | Backend NestJS (`PUT /api/activos/{id}`) |
| **Clasificación STRIDE:** | `Tampering` (Manipulación de Datos) |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A01:2021 - Broken Access Control / CWE-285` |
| **Actor Atacante (Persona):** | `CONSULTA` (Usuario autenticado en la plataforma) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Un usuario con el rol de solo lectura (`CONSULTA`) puede enviar peticiones HTTP `PUT` o `PATCH` con un payload JSON modificado para alterar atributos de cualquier activo fijo (como ubicación física, código patrimonial o valor de adquisición).

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N` (Puntaje Base: **6.5 - ALTO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Corrupción de datos patrimoniales y estado de los bienes | `8` |
| **Reproducibility (Reproducibilidad)** | Inmediata | `9` |
| **Exploitability (Explotabilidad)** | Fácil enviando payload JSON al endpoint PUT | `8` |
| **Affected Users (Usuarios Afectados)** | Toda la base de activos | `7` |
| **Discoverability (Descubrimiento)** | Alta | `8` |
| **Promedio DREAD:** | **8.0** | **ALTO** |

---

## 3. Descripción Técnica y Causa Raíz
Falta de decoradores de roles en el método `update()` del controlador de activos.

---

## 4. Prueba de Concepto (PoC)

```bash
curl -X PUT "http://localhost:3000/api/activos/ACT-001" \
  -H "Authorization: Bearer $TOKEN_CONSULTA" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Equipo Modificado Irrevocablemente"
  }'
```

---

## 5. Plan de Remedación

```diff
+ @UseGuards(RolesGuard)
+ @Roles(Role.ADMIN_ACTIVOS)
  @Put(':id')
  async actualizarActivo(...)
```

---

## 6. Prueba Automatizada de Regresión

```typescript
it('Debe retornar 403 al intentar modificar un activo con rol CONSULTA', async () => {
  await request(app.getHttpServer())
    .put('/api/activos/ACT-001')
    .set('Authorization', `Bearer ${tokenConsulta}`)
    .send({ name: 'Malicious Change' })
    .expect(403);
});
```
