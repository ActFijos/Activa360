import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E según Especificaciones Test_Playwright.md', () => {

  test('Flujo 1: Dashboard y Métricas Principales - Acceso y visualización del panel de control', async ({ page }) => {
    // 1. Pequeño e independiente: Empieza con page.goto
    await page.goto('/');

    // 2. Localizador de persona (data-testid & getByRole)
    const navDashboard = page.getByTestId('nav-dashboard');
    await expect(navDashboard).toBeVisible();

    // 3. Verifica lo que la interfaz promete (Título SCAF y marca)
    await expect(page.getByRole('heading', { name: 'SCAF' })).toBeVisible();
    await expect(page.getByText('Sistema de Gestión')).toBeVisible();
  });

  test('Flujo 2: Registro de Activos - Navegación a la vista de registro', async ({ page }) => {
    await page.goto('/');

    const navRegistro = page.getByTestId('nav-registro');
    await navRegistro.click();

    // Sin esperas fijas: aserción declarativa sobre la URL e interfaz
    await expect(page).toHaveURL(/\/registro$/);
    await expect(page.getByTestId('nav-registro')).toBeVisible();
  });

  test('Flujo 3: Asignación de Activos - Acceso al módulo de asignaciones a personal', async ({ page }) => {
    await page.goto('/');

    const navAsignacion = page.getByTestId('nav-asignacion');
    await navAsignacion.click();

    await expect(page).toHaveURL(/\/asignacion$/);
    await expect(page.getByTestId('nav-asignacion')).toBeVisible();
  });

  test('Flujo 4: Transferencias de Activos - Acceso al módulo de transferencias', async ({ page }) => {
    await page.goto('/');

    const navTransferencias = page.getByTestId('nav-transferencias');
    await navTransferencias.click();

    await expect(page).toHaveURL(/\/transferencias$/);
    await expect(page.getByTestId('nav-transferencias')).toBeVisible();
  });

  test('Flujo 5: Bajas de Activos SABS - Acceso al flujo de solicitudes de baja', async ({ page }) => {
    await page.goto('/');

    const navBajas = page.getByTestId('nav-bajas');
    await navBajas.click();

    await expect(page).toHaveURL(/\/bajas$/);
    await expect(page.getByTestId('nav-bajas')).toBeVisible();
  });

  test('Flujo 6: Generación de Reportes - Acceso a la vista de reportes e indicadores', async ({ page }) => {
    await page.goto('/');

    const navReportes = page.getByTestId('nav-reportes');
    await navReportes.click();

    await expect(page).toHaveURL(/\/reportes$/);
    await expect(page.getByTestId('nav-reportes')).toBeVisible();
  });

  test('Flujo 7: Asistencia IA - Acceso al módulo de asistencia técnica e IA', async ({ page }) => {
    await page.goto('/ayuda/asistente');

    await expect(page).toHaveURL(/\/ayuda\/asistente$/);
    await expect(page.locator('body')).toBeVisible();
  });

});
