# Hallazgo de Seguridad: H-009 — Solicitud Fraudulenta de Baja SABS sin Privilegios

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-009` (Relacionado con `RT-007`) |
| **Título del Hallazgo:** | Inicio de Trámites de Baja Patrimonial (SABS) por Personal de Inventario sin Autorización |
| **Categoría:** | `RBAC / Lógica de Negocio / Cumplimiento SABS` |
| **Componente Afectado:** | Backend NestJS (`POST /api/bajas/solicitar`) |
| **Clasificación STRIDE:** | `Elevation of Privilege` / `Tampering` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A01:2021 - Broken Access Control / CWE-285` |
| **Actor Atacante (Persona):** | `INVENTARIADOR` (Usuario con permisos de lectura e inventariado) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
El sistema permitía que usuarios con el rol `INVENTARIADOR` iniciaran solicitudes formales de baja definitiva de activos fijos en el flujo SABS, omitiendo la restricción de que solo los Custodios Responsables o Administradores Patrimoniales pueden generar dicho trámite.

---

## 2. Clasificación de Riesgo (CVSS: 7.2 - ALTO)

```bash
curl -X POST "http://localhost:3000/api/bajas/solicitar" \
  -H "Authorization: Bearer $TOKEN_INVENTARIADOR" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ACT-7711",
    "reason": "Obsolescencia Técnica (Ficticia)"
  }'
```

---

## 3. Plan de Remedación
Validar la matriz de permisos SABS en el Caso de Uso de Dominio (`SolicitarBajaUseCase`).

```diff
+ if (!user.roles.includes('ADMIN-ACTIVOS') && asset.custodianId !== user.id) {
+   throw new ForbiddenException('Solo el custodio o administrador puede solicitar la baja SABS');
+ }
```

---

## 4. Prueba Automatizada

```typescript
it('Debe rechazar solicitudes de baja initiadas por inventariadores no custodios', async () => {
  await request(app.getHttpServer())
    .post('/api/bajas/solicitar')
    .set('Authorization', `Bearer ${tokenInventariador}`)
    .send({ assetId: 'ACT-7711', reason: 'Falsa obsolescencia' })
    .expect(403);
});
```
