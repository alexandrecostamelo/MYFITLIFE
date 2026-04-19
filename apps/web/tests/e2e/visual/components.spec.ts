import { test, expect } from '@playwright/test';
import { stabilizeForScreenshot, mockDateToFixed } from './helpers';

test.describe('Visual — estados de componentes', () => {
  test.beforeEach(async ({ page }) => {
    await mockDateToFixed(page);
  });

  test('login com erro de credenciais', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'inexistente@teste.com');
    await page.fill('input[type="password"]', 'senhaerrada123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2_000);
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('login-erro.png');
  });

  test('recuperar senha formulário', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"]', 'teste@teste.com');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('forgot-filled.png');
  });

  test('404', async ({ page }) => {
    await page.goto('/rota-que-nao-existe-para-teste');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('404.png', { fullPage: true });
  });
});
