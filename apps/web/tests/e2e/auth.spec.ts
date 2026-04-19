import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('login form rejects empty credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /entrar/i }).click();
    // Should stay on login page (not redirect away)
    await expect(page).toHaveURL(/login/);
  });

  test('login form rejects wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nobody@example.com');
    await page.getByLabel(/senha/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();
    // Should show error or stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('signup page is accessible', async ({ page }) => {
    await page.goto('/signup');
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });
});
