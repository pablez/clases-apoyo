import { test, expect } from '@playwright/test';

test('ui admin login redirects to /admin and shows panel', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG>', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR>', err && err.message));

  await page.goto('http://localhost:4321/login');

  await page.fill('input[name="email"]', 'admin@clasesapoyo.com');
  await page.fill('input[name="password"]', 'admin123');

  await Promise.all([
    page.waitForURL('http://localhost:4321/admin', { timeout: 10000 }),
    page.click('button:has-text("Ingresar")')
  ]);

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator('text=Panel de Administración')).toBeVisible({ timeout: 10000 });
});
