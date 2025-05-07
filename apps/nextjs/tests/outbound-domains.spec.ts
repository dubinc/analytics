import { DUB_ANALYTICS_SCRIPT_URL } from '@/app/constants';
import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    _dubAnalytics: any;
  }
}

test.describe('Outbound domains tracking', () => {
  test('should add tracking parameters to outbound links', async ({ page }) => {
    // Set up test page with outbound domains configuration
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com,other.com"}'
      ></script>
      <a href="https://example.com">Example Link</a>
      <a href="https://other.com">Other Link</a>
      <a href="https://unrelated.com">Unrelated Link</a>
    `);

    // Wait for analytics to initialize
    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    // Set a dub_id cookie to simulate a tracked visit
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Wait for outbound tracking to process links
    await page.waitForTimeout(2500);

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
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com"}'
      ></script>
      <iframe src="https://example.com/embed"></iframe>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.waitForTimeout(2500);

    const iframe = await page.$('iframe');
    const iframeSrc = await iframe?.getAttribute('src');
    expect(iframeSrc).toContain('dub_id=test-click-id');
  });

  test('should not add tracking to links on the same domain', async ({
    page,
  }) => {
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com", "site": "localhost"}'
      ></script>
      <a href="https://localhost/about">Internal Link</a>
      <a href="https://example.com">External Link</a>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.waitForTimeout(2500);

    const internalLink = await page.$('a[href*="localhost"]');
    const externalLink = await page.$('a[href*="example.com"]');

    const internalHref = await internalLink?.getAttribute('href');
    const externalHref = await externalLink?.getAttribute('href');

    expect(internalHref).not.toContain('dub_id=test-click-id');
    expect(externalHref).toContain('dub_id=test-click-id');
  });

  test('should handle dynamically added links', async ({ page }) => {
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com"}'
      ></script>
      <div id="container"></div>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Add a link dynamically
    await page.evaluate(() => {
      const container = document.getElementById('container');
      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.textContent = 'Dynamic Link';
      container?.appendChild(link);
    });

    // Wait for outbound tracking to process the new link
    await page.waitForTimeout(2500);

    const dynamicLink = await page.$('a[href*="example.com"]');
    const dynamicHref = await dynamicLink?.getAttribute('href');
    expect(dynamicHref).toContain('dub_id=test-click-id');
  });

  test('should handle SPA navigation', async ({ page }) => {
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com"}'
      ></script>
      <div id="container"></div>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

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
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com,sub.example.com"}'
      ></script>
      <a href="https://www.example.com">WWW Link</a>
      <a href="https://example.com">No WWW Link</a>
      <a href="https://sub.example.com">Subdomain Link</a>
      <a href="https://other.example.com">Other Subdomain Link</a>
      <a href="https://www.sub.example.com">WWW Subdomain Link</a>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

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
    await page.setContent(`
      <script src="${DUB_ANALYTICS_SCRIPT_URL}" defer
        data-domains='{"outbound": "example.com"}'
      ></script>
      <iframe src="https://www.example.com/embed"></iframe>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'test-click-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.waitForTimeout(2500);

    const iframe = await page.$('iframe');
    const iframeSrc = await iframe?.getAttribute('src');
    expect(iframeSrc).toContain('dub_id=test-click-id');
  });
});
