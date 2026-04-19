import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/test-user';

// These tests require TEST_USER_EMAIL and TEST_USER_PASSWORD env vars
test.describe('Authenticated dashboard', () => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Skipped: TEST_USER_EMAIL not set');

  test('home dashboard loads after login', async ({ page }) => {
    await loginAsTestUser(page);
    await expect(page).toHaveURL(/\/app/);
    // Should show at least one of the main dashboard elements
    await expect(page.locator('main')).toBeVisible();
  });

  test('coach page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/app/coach');
    await expect(page.locator('main')).toBeVisible();
  });

  test('profile page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/app/profile');
    await expect(page.getByText(/perfil/i).first()).toBeVisible();
  });

  test('nutrition page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/app/nutrition');
    await expect(page.locator('main')).toBeVisible();
  });
});
