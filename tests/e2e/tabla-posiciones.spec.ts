import { test, expect } from '@playwright/test';

test('tabla-posiciones smoke', async ({ page }) => {
  await page.goto('/tabla-posiciones');
  await expect(page.locator('table')).toBeVisible();
});
