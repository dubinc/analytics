import { test, expect } from '@playwright/test';

test('should set dub_id cookie when ?dub_id= is present', async ({ page }) => {
  const clickId = 'kVrpHmuNu8Q9VpBG';
  await page.goto(`/?dub_id=${clickId}`);

  // Wait for the cookie to be set (max 5 seconds)
  await expect(async () => {
    const cookies = await page.context().cookies();
    const dubIdCookie = cookies.find((cookie) => cookie.name === 'dub_id');

    expect(dubIdCookie).toBeDefined();
    expect(dubIdCookie?.value).toBe(clickId);
  }).toPass({ timeout: 5000 });
});
