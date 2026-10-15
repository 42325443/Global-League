import { test, expect } from '@playwright/test';

test('auth smoke full', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
