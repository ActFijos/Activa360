import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E: Navegación Estabilidad SCAF', () => {

  test('Debe verificar la presencia del branding principal SCAF', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.logo-text h2')).toHaveText('SCAF');
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });

  test('Debe realizar transición fluida hacia Registro de Activos', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nav-registro').click();
    await expect(page).toHaveURL(/\/registro$/);
  });

  test('Debe realizar transición fluida hacia Asignación de Activos', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nav-asignacion').click();
    await expect(page).toHaveURL(/\/asignacion$/);
  });

  test('Debe realizar transición fluida hacia Transferencias', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nav-transferencias').click();
    await expect(page).toHaveURL(/\/transferencias$/);
  });

  test('Debe realizar transición fluida hacia Bajas SABS', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nav-bajas').click();
    await expect(page).toHaveURL(/\/bajas$/);
  });

  test('Debe realizar transición fluida hacia Reportes', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('nav-reportes').click();
    await expect(page).toHaveURL(/\/reportes$/);
  });

});
