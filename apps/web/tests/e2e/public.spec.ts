import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/MyFitLife|Login/i);
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/termos');
    await expect(page.getByText(/termos/i).first()).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page.getByText(/privacidade/i).first()).toBeVisible();
  });

  test('unauthenticated access to /app redirects to login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated access to /app/coach redirects to login', async ({ page }) => {
    await page.goto('/app/coach');
    await expect(page).toHaveURL(/login/);
  });
});
