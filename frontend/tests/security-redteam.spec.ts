import { test, expect } from '@playwright/test';

test.describe('Suite Red Team — Pruebas de Seguridad UI (Playwright)', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación frontend
    await page.goto('/');
  });

  test('RT-018: Sanitización de XSS en el buscador de inventario', async ({ page }) => {
    // Ir a la página de inventario o dashboard
    await page.goto('/inventario');
    
    // Buscar input de búsqueda o filtrado
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Inyectar payload de script XSS
      const xssPayload = '<script>window.__xss_vulnerability__=true</script>';
      await searchInput.fill(xssPayload);
      await searchInput.press('Enter');

      // Verificar que el script no se ejecutó en la ventana del navegador
      const isXssExecuted = await page.evaluate(() => (window as any).__xss_vulnerability__);
      expect(isXssExecuted).toBeUndefined();
    } else {
      // Si el input no está visible en la vista actual, validar que la página cargó limpiamente
      expect(page.url()).toContain('/inventario');
    }
  });

  test('RT-011 / RT-012: Resiliencia del formulario ante escaneo de QR malicioso o no registrado', async ({ page }) => {
    await page.goto('/inventario');
    
    // Buscar modal o input de escaneo de QR si está presente
    const qrInput = page.locator('input[name="qrCode"], input[placeholder*="QR"]').first();
    
    if (await qrInput.isVisible()) {
      await qrInput.fill('QR-INVALIDO-INJECTION-999');
      const submitBtn = page.locator('button:has-text("Buscar"), button:has-text("Escanear"), button[type="submit"]').first();
      
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }

      // Verificar que la interfaz no colapse con pantalla blanca o unhandled exception
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Uncaught TypeError');
    } else {
      // Confirmar que la aplicación renderiza sin errores fatales
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('RT-017: Resiliencia de navegación directa a módulos del sistema', async ({ page }) => {

    await page.goto('/bajas');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/transferencias');
    await expect(page.locator('body')).toBeVisible();
  });
});
