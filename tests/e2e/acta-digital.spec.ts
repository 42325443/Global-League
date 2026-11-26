import { test, expect } from '@playwright/test';

test('acta-digital smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Global/);
});
