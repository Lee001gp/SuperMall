import { test, expect } from '@playwright/test';

test('store portal opens', async ({ page }) => {
  await page.goto('http://localhost:5174');
  await expect(page.locator('text=Store Portal')).toBeVisible();
});

test('mall admin opens', async ({ page }) => {
  await page.goto('http://localhost:5175');
  await expect(page.locator('text=Mall Admin')).toBeVisible();
});

test('platform admin opens', async ({ page }) => {
  await page.goto('http://localhost:5176');
  await expect(page.locator('text=Platform Admin')).toBeVisible();
});
