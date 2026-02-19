import { test, expect } from '@playwright/test';

test('customer critical flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('input[placeholder="email"]', `cust${Date.now()}@mail.local`);
  await page.fill('input[placeholder="password"]', 'Passw0rd!');
  await page.click('text=Register');
  await page.click('text=Login');
  await page.click('text=North Galleria');
  await expect(page.locator('text=Mall Detail')).toBeVisible();
  await page.click('text=Open');
  await expect(page.locator('text=Walking distance to another store')).toBeVisible();
});
