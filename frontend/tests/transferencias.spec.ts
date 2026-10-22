import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E: Módulo de Transferencias', () => {

  test('Debe cargar la página de transferencias y mostrar los controles principales', async ({ page }) => {
    await page.goto('/transferencias');

    // Verificar que la URL sea /transferencias
    await expect(page).toHaveURL(/\/transferencias$/);

    // Verificar visibilidad del cuerpo de la página
    const contentBody = page.locator('.content-body');
    await expect(contentBody).toBeVisible();
  });

});
