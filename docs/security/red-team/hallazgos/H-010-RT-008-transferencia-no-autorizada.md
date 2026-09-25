# Hallazgo de Seguridad: H-010 — Transferencia No Autorizada de Custodios

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-010` (Relacionado con `RT-008`) |
| **Título del Hallazgo:** | Ejecución Directa de Transferencias de Bienes entre Custodios por Usuarios de Consulta |
| **Categoría:** | `RBAC / Transferencias Patrimoniales` |
| **Componente Afectado:** | Backend NestJS (`POST /api/transferencias`) |
| **Clasificación STRIDE:** | `Elevation of Privilege` / `Repudiation` |
| **CWE / OWASP MAPPING:** | `OWASP Top 10 A01:2021 - Broken Access Control / CWE-285` |
| **Actor Atacante (Persona):** | `CONSULTA` (Usuario sin privilegios de gestión de activos) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
Un usuario con el rol de `CONSULTA` puede enviar una solicitud HTTP para cambiar la custodia de un activo fijo a favor de un tercero sin contar con la aprobación del administrador patrimonial ni la aceptación del nuevo custodio.

---

## 2. Clasificación de Riesgo (CVSS: 7.2 - ALTO)

```bash
curl -X POST "http://localhost:3000/api/transferencias" \
  -H "Authorization: Bearer $TOKEN_CONSULTA" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ACT-8833",
    "targetCustodianId": "USR-99"
  }'
```

---

## 3. Plan de Remedación
Requerir roles explícitos `ADMIN-ACTIVOS` o firma del flujo de doble aprobación en la capa de servicio de dominio.

---

## 4. Prueba Automatizada

```typescript
it('Debe rechazar transferencias iniciadas por el rol CONSULTA', async () => {
  await request(app.getHttpServer())
    .post('/api/transferencias')
    .set('Authorization', `Bearer ${tokenConsulta}`)
    .send({ assetId: 'ACT-8833', targetCustodianId: 'USR-99' })
    .expect(403);
});
```
