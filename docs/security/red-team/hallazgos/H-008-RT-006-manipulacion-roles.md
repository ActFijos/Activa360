# Hallazgo de Seguridad: H-008 — Mass Assignment / Inyección de Roles en DTO de Usuario

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-008` (Relacionado con `RT-006`) |
| **Título del Hallazgo:** | Escalación Crítica de Privilegios mediante Inyección del Campo `roles` en DTOs no Filtrados por Lista Blanca |
| **Categoría:** | `RBAC / Mass Assignment / Escalada de Privilegios` |
| **Componente Afectado:** | Backend NestJS (`UpdateProfileDto` / `ValidationPipe` global) |
| **Clasificación STRIDE:** | `Elevation of Privilege` (Escalada de Privilegios) |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A08:2021 - Software and Data Integrity Failures / CWE-915` |
| **Actor Atacante (Persona):** | `ATK-USER` (Usuario común intentando promoverse a Administrador) |
| **Severidad Estimada:** | **CRÍTICO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Un usuario común puede auto-asignarse el rol de `ADMIN-ACTIVOS` enviando la propiedad oculta `"roles": ["ADMIN-ACTIVOS"]` en el cuerpo de una solicitud de actualización de perfil (`PUT /api/users/profile`).

Esto ocurre cuando el marco NestJS no utiliza `whitelist: true` y `forbidNonWhitelisted: true` en el `ValidationPipe`, o cuando el DTO de entrada mapea directamente el cuerpo de la petición hacia la entidad de dominio.

---

## 2. Clasificación y Puntaje de Riesgo (CVSS v3.1 / DREAD)

### Vector CVSS v3.1
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H` (Puntaje Base: **8.8 - CRÍTICO**)

### Métricas DREAD
| Métrica | Definición | Calificación (1-10) |
| :--- | :--- | :---: |
| **Damage Potential (Daño)** | Control total de la plataforma y datos patrimoniales | `10` |
| **Reproducibility (Reproducibilidad)** | Inmediata | `9` |
| **Exploitability (Explotabilidad)** | Trivial inyectando un campo en la petición JSON | `9` |
| **Affected Users (Usuarios Afectados)** | Impacto total en la infraestructura | `9` |
| **Discoverability (Descubrimiento)** | Alta mediante pruebas fuzzing de DTOs | `7` |
| **Promedio DREAD:** | **8.8** | **CRÍTICO** |

---

## 3. Descripción Técnica y Causa Raíz

### 3.1 Comportamiento Inseguro Detectado
El controlador tomaba el objeto `@Body()` completo y lo pasaba a la base de datos sin stripping de atributos no autorizados, permitiendo la reasignación de roles en la tabla de usuarios.

---

## 4. Prueba de Concepto (PoC)

```bash
curl -X PUT "http://localhost:3000/api/users/profile" \
  -H "Authorization: Bearer $TOKEN_USER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Normal",
    "roles": ["ADMIN-ACTIVOS"]
  }'
```

---

## 5. Plan de Remedación

1. Configurar el pipe de validación global con filtrado estricto.
2. Mapear únicamente campos permitidos en los casos de uso.

```diff
  app.useGlobalPipes(new ValidationPipe({
+   whitelist: true,
+   forbidNonWhitelisted: true,
    transform: true,
  }));
```

---

## 6. Prueba Automatizada de Regresión

```typescript
it('Debe rechazar la inyección del campo roles en el DTO de perfil', async () => {
  await request(app.getHttpServer())
    .put('/api/users/profile')
    .set('Authorization', `Bearer ${tokenUser}`)
    .send({ name: 'Usuario Normal', roles: ['ADMIN-ACTIVOS'] })
    .expect(400);
});
```
