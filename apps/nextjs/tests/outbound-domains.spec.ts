import { DUB_ANALYTICS_SCRIPT_URL } from '@/app/constants';
import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    _dubAnalytics: any;
  }
}

test.describe('Outbound domains tracking', () => {
  test('should add tracking parameters to outbound links', async ({ page }) => {
    await page.goto('/outbound?dub_id=test-click-id');

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    await page.waitForTimeout(1000);

    // Check that outbound links have tracking parameters
    const exampleLink = await page.$('a[href*="example.com"]');
    const otherLink = await page.$('a[href*="other.com"]');
    const unrelatedLink = await page.$('a[href*="unrelated.com"]');

    const exampleHref = await exampleLink?.getAttribute('href');
    const otherHref = await otherLink?.getAttribute('href');
    const unrelatedHref = await unrelatedLink?.getAttribute('href');

    expect(exampleHref).toContain('dub_id=test-click-id');
    expect(otherHref).toContain('dub_id=test-click-id');
    expect(unrelatedHref).not.toContain('dub_id=test-click-id');
  });

  test('should handle iframe src attributes', async ({ page }) => {
    await page.goto('/outbound?dub_id=test-click-id');

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    await page.waitForTimeout(2000);

    const iframe = await page.$('iframe');
    const iframeSrc = await iframe?.getAttribute('src');
    expect(iframeSrc).toContain('dub_id=test-click-id');
  });

  test('should not add tracking to links on the same domain', async ({
    page,
  }) => {
    await page.goto('/outbound?dub_id=test-click-id');

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    await page.waitForTimeout(2000);

    const internalLink = await page.$('a[href*="getacme.link"]');
    const externalLink = await page.$('a[href*="example.com"]');

    const internalHref = await internalLink?.getAttribute('href');
    const externalHref = await externalLink?.getAttribute('href');

    expect(internalHref).not.toContain('dub_id=test-click-id');
    expect(externalHref).toContain('dub_id=test-click-id');
  });

  // TODO: Fix this test
  test.skip('should handle dynamically added links', async ({ page }) => {
    await page.goto('/outbound?dub_id=test-click-id');

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    //  Add a link dynamically
    await page.evaluate(() => {
      const container = document.getElementById('container');
      const link = document.createElement('a');
      link.href = 'https://dynamic-link.com';
      link.textContent = 'Dynamic Link';
      container?.appendChild(link);
    });

    await page.waitForTimeout(2500);

    const dynamicLink = await page.$('a[href*="dynamic-link.com"]');
    const dynamicHref = await dynamicLink?.getAttribute('href');
    expect(dynamicHref).toContain('dub_id=test-click-id');
  });

  test('should handle SPA navigation', async ({ page }) => {
    await page.goto('/outbound?dub_id=test-click-id');

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    // Simulate SPA navigation
    await page.evaluate(() => {
      history.pushState({}, '', '/new-page');
      const container = document.getElementById('container');
      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.textContent = 'SPA Link';
      container?.appendChild(link);
    });

    await page.waitForTimeout(2500);

    const spaLink = await page.$('a[href*="example.com"]');
    const spaHref = await spaLink?.getAttribute('href');
    expect(spaHref).toContain('dub_id=test-click-id');
  });

  test('should handle www. prefix and subdomains correctly', async ({
    page,
  }) => {
    await page.goto('/outbound?dub_id=test-click-id');
    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    await page.waitForTimeout(2500);

    // Check www. prefix handling
    const wwwLink = await page.$('a[href*="www.example.com"]');
    const noWwwLink = await page.$(
      'a[href*="example.com"]:not([href*="www."])',
    );
    const wwwHref = await wwwLink?.getAttribute('href');
    const noWwwHref = await noWwwLink?.getAttribute('href');

    expect(wwwHref).toContain('dub_id=test-click-id');
    expect(noWwwHref).toContain('dub_id=test-click-id');

    // Check subdomain handling
    const subdomainLink = await page.$(
      'a[href*="sub.example.com"]:not([href*="www."])',
    );
    const otherSubdomainLink = await page.$('a[href*="other.example.com"]');
    const wwwSubdomainLink = await page.$('a[href*="www.sub.example.com"]');

    const subdomainHref = await subdomainLink?.getAttribute('href');
    const otherSubdomainHref = await otherSubdomainLink?.getAttribute('href');
    const wwwSubdomainHref = await wwwSubdomainLink?.getAttribute('href');

    expect(subdomainHref).toContain('dub_id=test-click-id');
    expect(otherSubdomainHref).not.toContain('dub_id=test-click-id');
    expect(wwwSubdomainHref).toContain('dub_id=test-click-id');
  });

  test('should handle www. prefix in iframe src', async ({ page }) => {
    await page.goto('/outbound?dub_id=test-click-id');
    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    await page.waitForTimeout(2500);

    const iframe = await page.$('iframe');
    const iframeSrc = await iframe?.getAttribute('src');
    expect(iframeSrc).toContain('dub_id=test-click-id');
  });
});
