import type { Page } from '@playwright/test';

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@myfitlife.app',
  password: process.env.TEST_USER_PASSWORD || 'test-password-123',
};

export async function loginAsTestUser(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/senha/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/app**');
}

export async function logout(page: Page) {
  await page.goto('/app/profile');
  await page.getByRole('button', { name: /sair/i }).click();
  await page.waitForURL('**/login**');
}
