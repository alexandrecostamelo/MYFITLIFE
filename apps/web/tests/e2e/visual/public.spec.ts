import { test, expect } from '@playwright/test';
import { stabilizeForScreenshot, mockDateToFixed } from './helpers';

test.describe('Visual — páginas públicas', () => {
  test.beforeEach(async ({ page }) => {
    await mockDateToFixed(page);
  });

  test('home', async ({ page }) => {
    await page.goto('/');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('login', async ({ page }) => {
    await page.goto('/login');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('recuperar-senha', async ({ page }) => {
    await page.goto('/forgot-password');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('forgot-password.png', { fullPage: true });
  });

  test('termos', async ({ page }) => {
    await page.goto('/termos');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('termos.png', { fullPage: true });
  });

  test('privacidade', async ({ page }) => {
    await page.goto('/privacidade');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('privacidade.png', { fullPage: true });
  });
});
