import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Dub Analytics');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Dub Analytics Example App',
    );

    await expect(page.getByRole('main')).toBeVisible();
  });
});
