# Hallazgo de Seguridad: H-011 — Transferencia Invalidadora de Activos en Estado BAJA

---

## 📌 Metadata del Hallazgo

| Campo | Valor / Detalle |
| :--- | :--- |
| **ID del Hallazgo:** | `H-011` (Relacionado con `RT-009`) |
| **Título del Hallazgo:** | Transferencia de Activos Fijos Inactivos o Dados de Baja por Falta de Guardas de Estado de Dominio |
| **Categoría:** | `Lógica de Negocio / Invariantes de Dominio` |
| **Componente Afectado:** | Backend NestJS (`TransferirActivoUseCase` / Dominio Asset Entity) |
| **Clasificación STRIDE:** | `Tampering` (Manipulación de Estado) |
| **CWE / OWASP MAPPING:** | `CWE-840: Business Logic Errors / OWASP A04:2021` |
| **Actor Atacante (Persona):** | `ADMIN-ACTIVOS` (Administrador cometiendo inconsistencia o bypass) |
| **Severidad Estimada:** | **ALTO** |
| **Estado:** | **Verificado en CI-CD** |

---

## 1. Resumen Ejecutivo
El sistema permitía ejecutar transferencias de custodia sobre activos fijos que ya se encontraban formalmente en el estado `DISPOSED` (Dado de baja SABS), violando la regla de negocio que establece que un activo dado de baja es inmutable y no puede reasignarse.

---

## 2. Clasificación de Riesgo (CVSS: 6.5 - ALTO)

```bash
curl -X POST "http://localhost:3000/api/transferencias" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ACT-BAJA-001",
    "targetCustodianId": "USR-10"
  }'
```

---

## 3. Plan de Remedación (Arquitectura Hexagonal)
En la entidad de dominio `Asset`:

```diff
  transferTo(newCustodianId: string) {
+   if (this.status === AssetStatus.DISPOSED) {
+     throw new DomainException('No se puede transferir un activo que ha sido dado de baja SABS');
+   }
    this.custodianId = newCustodianId;
  }
```

---

## 4. Prueba Automatizada

```typescript
it('Debe rechazar la transferencia de un activo en estado BAJA SABS', async () => {
  await request(app.getHttpServer())
    .post('/api/transferencias')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ assetId: 'ACT-BAJA-001', targetCustodianId: 'USR-10' })
    .expect(422); // Unprocessable Entity
});
```
