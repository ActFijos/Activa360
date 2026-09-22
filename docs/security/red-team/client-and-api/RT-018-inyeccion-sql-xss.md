# Ficha Red Team: RT-018 — Inyección SQL / ORM y Stored / Reflected XSS

- **ID del Caso:** `RT-018`
- **Categoría:** API y Cliente / Sanitización de Entradas
- **Actor (Atacante):** `ATK-EXT` / `ATK-USER`
- **Nivel de Severidad:** **CRÍTICO**
- **Componente Afectado:** Backend NestJS (Prisma ORM) / Frontend React UI (JSX Rendering)

---

## 1. Descripción del Ataque
El atacante introduce payloads SQL/ORM (`' OR '1'='1`, `'; DROP TABLE app.assets; --`) o vector de scripts Cross-Site Scripting (`<script>alert(document.cookie)</script>`, `<img src=x onerror=alert(1)>`) en campos de búsqueda, nombres de activo, descripciones u observaciones.

## 2. Precondiciones
- Campos de entrada expuestos en la interfaz y controladores API (`name`, `description`, `searchQuery`).

## 3. Pruebas Manuales (HTTP Requests)

```bash
# Inyección en parámetro de búsqueda
curl -X GET "http://localhost:3000/api/activos?q=%27%20OR%20%271%27=%271" \
  -H "Authorization: Bearer $TOKEN"

# Payload Stored XSS en creación de activo
curl -X POST "http://localhost:3000/api/activos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ACT-XSS-001",
    "name": "<script>window.xssInjected=true</script>"
  }'
```

### Respuesta Esperada
- Prisma ORM parametriza automáticamente las consultas evitando SQL Injection.
- El backend/frontend escapa o codifica caracteres HTML, impidiendo la ejecución de JavaScript en el DOM.

## 4. Prueba Automatizada de Regresión (Playwright E2E & Jest)
**Ubicación:** `test/playwright/security/rt-018-xss-sanitizing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('RT-018: Inyección XSS en Renderizado React', async ({ page }) => {
  await page.goto('http://localhost:5173/inventario');
  const searchInput = page.locator('input[type="search"], #search-asset').first();

  await searchInput.fill('<script>window.xssFlag=true</script>');
  await searchInput.press('Enter');

  const xssExecuted = await page.evaluate(() => (window as any).xssFlag);
  expect(xssExecuted).toBeUndefined();
});
```

## 5. Criterios de Aceptación y Remedición
- [ ] De acuerdo con los guardrails del proyecto ([AGENTS.md](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/AGENTS.md#L30)), está **prohibido generar consultas SQL crudas** sin parametrización u ORM.
- [ ] Ningún componente React utiliza `dangerouslySetInnerHTML` sin sanitización con DOMPurify.
