import { test, expect } from '@playwright/test';
import { stabilizeForScreenshot, mockDateToFixed } from './helpers';

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe('Visual — telas autenticadas', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_TEST_EMAIL e E2E_TEST_PASSWORD são necessários');

  test.beforeEach(async ({ page }) => {
    await mockDateToFixed(page);
    await page.goto('/login');
    await page.fill('input[type="email"]', EMAIL!);
    await page.fill('input[type="password"]', PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app/, { timeout: 15_000 });
  });

  test('dashboard', async ({ page }) => {
    await page.goto('/app');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      mask: [page.locator('[data-dynamic]'), page.locator('time')],
    });
  });

  test('perfil', async ({ page }) => {
    await page.goto('/app/profile');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('profile.png', { fullPage: true });
  });

  test('skills', async ({ page }) => {
    await page.goto('/app/skills');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1_500);
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('skills.png', { fullPage: true });
  });

  test('nutrição', async ({ page }) => {
    await page.goto('/app/nutrition');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('nutrition.png', { fullPage: true });
  });

  test('treino', async ({ page }) => {
    await page.goto('/app/workout');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('workout.png', { fullPage: true });
  });

  test('coach', async ({ page }) => {
    await page.goto('/app/coach');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('coach.png', { fullPage: true });
  });

  test('transformações', async ({ page }) => {
    await page.goto('/app/transformations');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('transformations.png', { fullPage: true });
  });

  test('settings', async ({ page }) => {
    await page.goto('/app/settings');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });

  test('billing', async ({ page }) => {
    await page.goto('/app/billing');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('billing.png', { fullPage: true });
  });

  test('desafios', async ({ page }) => {
    await page.goto('/app/challenges');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('challenges.png', { fullPage: true });
  });

  test('conquistas', async ({ page }) => {
    await page.goto('/app/achievements');
    await stabilizeForScreenshot(page);
    await expect(page).toHaveScreenshot('achievements.png', { fullPage: true });
  });
});
