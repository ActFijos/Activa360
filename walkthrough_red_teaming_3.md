# Walkthrough — Ejecución del Paso 3: Cobertura Completa de la Matriz en `test/security/`

Se ha generado la totalidad de los archivos de prueba E2E de seguridad en `test/security/` para cubrir la matriz completa de casos de [Red Teaming.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/Red%20Teaming.md).

---

## 📁 Archivos de Prueba Creados en `test/security/`

1. [test/security/rt-001-bypass-auth.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-001-bypass-auth.e2e-spec.ts) (`RT-001` - Bypass de Autenticación)
2. [test/security/rt-002-bypass-autorizacion.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-002-bypass-autorizacion.e2e-spec.ts) (`RT-002` - Bypass de Autorización por Rol)
3. [test/security/rt-003-idor-activos.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-003-idor-activos.e2e-spec.ts) (`RT-003` - IDOR en Consulta de Activos)
4. [test/security/rt-007-baja-rbac.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-007-baja-rbac.e2e-spec.ts) (`RT-007` - Baja No Autorizada SABS)
5. [test/security/rt-008-transferencia-no-autorizada.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-008-transferencia-no-autorizada.e2e-spec.ts) (`RT-008` - Transferencia No Autorizada)
6. [test/security/rt-009-transferencia-baja.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-009-transferencia-baja.e2e-spec.ts) (`RT-009` - Transferencia de Activo Dado de Baja)
7. [test/security/rt-010-race-condition.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-010-race-condition.e2e-spec.ts) (`RT-010` - Race Condition y Doble Asignación)
8. [test/security/rt-013-state-machine.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-013-state-machine.e2e-spec.ts) (`RT-013` - Manipulación Arbitraria de Estado)
9. [test/security/rt-014-valores-invalidos.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-014-valores-invalidos.e2e-spec.ts) (`RT-014` - Inyección de Valores Límite Inválidos)
10. [test/security/rt-016-inmutabilidad-auditoria.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-016-inmutabilidad-auditoria.e2e-spec.ts) (`RT-016` - Inmutabilidad de Auditoría)
11. [test/security/rt-020-prompt-injection.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/rt-020-prompt-injection.e2e-spec.ts) (`RT-020` - Direct Prompt Injection)
12. [test/security/ia-002-mcp-tool-governance.e2e-spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/test/security/ia-002-mcp-tool-governance.e2e-spec.ts) (`IA-002` - Gobernanza en MCP Tool Calling)

---

## 🚀 Comandos de Ejecución

Para correr toda la suite de seguridad backend en NestJS:
```bash
npm run test:security
```

Para correr las pruebas de seguridad frontend en Playwright:
```bash
cd frontend && npm run test:security
```
