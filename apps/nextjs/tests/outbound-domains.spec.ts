import { test, expect } from '@playwright/test';

test.describe('Outbound Domains Extension', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the _dubAnalytics global object
    await page.addInitScript(() => {
      window._dubAnalytics = {
        c: {
          get: (key: string) => 'test-cookie-value',
        },
        i: 'dub_id',
        h: 'example.com',
        n: {
          outbound: ['test.com', 'app.test.com'],
        },
      };
    });

    // Load the outbound-domains script
    await page.addScriptTag({
      path: './packages/script/dist/extensions/outbound-domains.js',
    });
  });

  test('should add tracking parameter to outbound links', async ({ page }) => {
    await page.setContent(`
      <a href="https://test.com">Test Link</a>
      <a href="https://www.test.com">Test Link with www</a>
      <a href="https://app.test.com/blog/why-we-built-dub">App Test Link</a>
      <a href="https://example.com">Internal Link</a>
    `);

    // Wait for the script to process the links
    await page.waitForTimeout(100);

    // Check that outbound links have the tracking parameter
    const testLink = page.locator('a[href*="test.com"]').first();
    const appLink = page.locator('a[href*="app.test.com"]');
    const internalLink = page.locator('a[href*="example.com"]');

    await expect(testLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
    await expect(appLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
    await expect(internalLink).not.toHaveAttribute(
      'href',
      /dub_id=test-cookie-value/,
    );
  });

  test('should add tracking parameter to iframes', async ({ page }) => {
    await page.setContent(`
      <iframe src="https://app.test.com/blog/embed/why-we-built-dub"></iframe>
      <iframe src="https://example.com/embed"></iframe>
    `);

    // Wait for the script to process the iframes
    await page.waitForTimeout(100);

    // Check that outbound iframes have the tracking parameter
    const appIframe = page.locator('iframe[src*="app.test.com"]');
    const internalIframe = page.locator('iframe[src*="example.com"]');

    await expect(appIframe).toHaveAttribute('src', /dub_id=test-cookie-value/);
    await expect(internalIframe).not.toHaveAttribute(
      'src',
      /dub_id=test-cookie-value/,
    );
  });

  test('should handle string configuration for outbound domains', async ({
    page,
  }) => {
    // Override the configuration to use string format
    await page.addInitScript(() => {
      window._dubAnalytics = {
        c: {
          get: (key: string) => 'test-cookie-value',
        },
        i: 'dub_id',
        h: 'example.com',
        n: {
          outbound: 'test.com, app.test.com',
        },
      };
    });

    await page.setContent(`
      <a href="https://test.com">Test Link</a>
      <a href="https://app.test.com/blog/why-we-built-dub">App Test Link</a>
    `);

    // Wait for the script to process the links
    await page.waitForTimeout(100);

    // Check that outbound links have the tracking parameter
    const testLink = page.locator('a[href*="test.com"]');
    const appLink = page.locator('a[href*="app.test.com"]');

    await expect(testLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
    await expect(appLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
  });

  test('should handle www subdomains correctly', async ({ page }) => {
    await page.setContent(`
      <a href="https://www.test.com">Test Link with www</a>
      <a href="https://test.com">Test Link without www</a>
      <a href="https://sub.test.com">Test Link with subdomain</a>
    `);

    // Wait for the script to process the links
    await page.waitForTimeout(100);

    // Check that only exact domain matches have the tracking parameter
    const wwwLink = page.locator('a[href*="www.test.com"]');
    const noWwwLink = page.locator('a[href*="test.com"]').nth(1);
    const subdomainLink = page.locator('a[href*="sub.test.com"]');

    await expect(wwwLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
    await expect(noWwwLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
    await expect(subdomainLink).not.toHaveAttribute(
      'href',
      /dub_id=test-cookie-value/,
    );
  });

  test('should handle www.test.com URLs with paths', async ({ page }) => {
    await page.setContent(`
      <a href="https://www.test.com/blog">Blog Link with www</a>
      <a href="https://www.test.com/blog/why-we-built-dub">Blog Post with www</a>
      <a href="https://www.test.com/pricing">Pricing with www</a>
      <iframe src="https://www.test.com/embed/blog"></iframe>
    `);

    // Wait for the script to process the elements
    await page.waitForTimeout(100);

    // Check that all www.test.com URLs have the tracking parameter
    const blogLink = page.locator('a[href*="www.test.com/blog"]').first();
    const blogPostLink = page.locator(
      'a[href*="www.test.com/blog/why-we-built-dub"]',
    );
    const pricingLink = page.locator('a[href*="www.test.com/pricing"]');
    const iframe = page.locator('iframe[src*="www.test.com/embed"]');

    await expect(blogLink).toHaveAttribute('href', /dub_id=test-cookie-value/);
    await expect(blogPostLink).toHaveAttribute(
      'href',
      /dub_id=test-cookie-value/,
    );
    await expect(pricingLink).toHaveAttribute(
      'href',
      /dub_id=test-cookie-value/,
    );
    await expect(iframe).toHaveAttribute('src', /dub_id=test-cookie-value/);
  });

  test('should not add tracking parameter if cookie is not present', async ({
    page,
  }) => {
    // Override the configuration to return no cookie
    await page.addInitScript(() => {
      window._dubAnalytics = {
        c: {
          get: (key: string) => null,
        },
        i: 'dub_id',
        h: 'example.com',
        n: {
          outbound: ['test.com'],
        },
      };
    });

    await page.setContent(`
      <a href="https://test.com">Test Link</a>
    `);

    // Wait for the script to process the links
    await page.waitForTimeout(100);

    // Check that the link doesn't have the tracking parameter
    const testLink = page.locator('a[href*="test.com"]');
    await expect(testLink).not.toHaveAttribute('href', /dub_id=/);
  });
});
