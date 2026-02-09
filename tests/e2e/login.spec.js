import { test, expect } from '@playwright/test';

test('programmatic login and view asistencias', async ({ page }) => {
  // Programmatic login: call API, set cookie in browser, then navigate to /alumno
  const loginResp = await page.request.post('http://localhost:4321/api/auth/login', { data: { email: '1', password: 'test' } });
  const loginBody = await loginResp.json();
  if (loginResp.status() !== 200) throw new Error('Login failed in E2E: ' + JSON.stringify(loginBody));
  const token = loginBody.token;
  // Set cookie in browser context
  await page.context().addCookies([{ name: 'session', value: token, url: 'http://localhost:4321', httpOnly: true }]);

  // Now navigate to alumno page
  await page.goto('http://localhost:4321/alumno');

  // Ensure main header is visible
  await expect(page.locator('text=Mi historial de asistencias')).toBeVisible({ timeout: 10000 });

  // Expect asistencia cards to be present (matching the card container used in UI)
  const cards = page.locator('div.p-3.border.rounded-lg');
  await expect(cards.first()).toBeVisible({ timeout: 10000 });
});
