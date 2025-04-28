import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    _dubAnalytics: any;
  }
}

test.describe('Analytics configuration', () => {
  test('should work with data-domains props', async ({ page }) => {
    // Set up test page with domainsConfig
    await page.setContent(`
      <script src="https://www.dubcdn.com/analytics/script.js" defer
        data-domains='{"refer": "go.example.com", "site": "site.example.com", "outbound": "example.com,other.com"}'
      ></script>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    const analytics = await page.evaluate(() => window._dubAnalytics);

    expect(analytics.n).toEqual({
      refer: 'go.example.com',
      site: 'site.example.com',
      outbound: 'example.com,other.com',
    });
  });

  test('should maintain backwards compatibility with data-short-domain', async ({
    page,
  }) => {
    // Set up test page with old shortDomain prop
    await page.setContent(`
      <script src="https://www.dubcdn.com/analytics/script.js" defer data-short-domain="go.example.com"></script>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    // Verify shortDomain was correctly mapped to domainsConfig.refer
    const analytics = await page.evaluate(() => window._dubAnalytics);
    expect(analytics.n).toEqual({
      refer: 'go.example.com',
    });
    expect(analytics.d).toBe('go.example.com');
  });

  test('should prioritize domainsConfig.refer over shortDomain', async ({
    page,
  }) => {
    // Set up test page with both old and new props
    await page.setContent(`
      <script src="https://www.dubcdn.com/analytics/script.js" defer
        data-short-domain="old.example.com"
        data-domains='{"refer": "new.example.com"}'
      ></script>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    // Verify domainsConfig.refer takes precedence
    const analytics = await page.evaluate(() => window._dubAnalytics);
    expect(analytics.n).toEqual({
      refer: 'new.example.com',
    });
    expect(analytics.d).toBe('new.example.com');
  });

  test('should handle first-click attribution model', async ({ page }) => {
    // Set up test page with first-click attribution
    await page.setContent(`
      <script src="https://www.dubcdn.com/analytics/script.js" defer
        data-attribution-model="first-click"
        data-short-domain="go.example.com"
      ></script>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    const analytics = await page.evaluate(() => window._dubAnalytics);
    expect(analytics.m).toBe('first-click');

    // Set initial cookie using Playwright's cookie API
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'initial-id',
        path: '/',
        domain: 'localhost',
      },
    ]);

    // Simulate click with new ID
    await page.goto('/?dub_id=xxxx');

    // Wait for the cookie to be set (max 5 seconds)
    await expect(async () => {
      const cookies = await page.context().cookies();
      const dubIdCookie = cookies.find((cookie) => cookie.name === 'dub_id');

      expect(dubIdCookie).toBeDefined();
      expect(dubIdCookie?.value).toBe('initial-id');
    }).toPass({ timeout: 5000 });

    await page.context().clearCookies();
  });

  test('should handle last-click attribution model', async ({ page }) => {
    // Set up test page with last-click attribution
    await page.setContent(`
      <script src="https://www.dubcdn.com/analytics/script.js" defer
        data-attribution-model="last-click"
        data-short-domain="getacme.link"
      ></script>
    `);

    await page.waitForFunction(() => window._dubAnalytics !== undefined);

    const analytics = await page.evaluate(() => window._dubAnalytics);
    expect(analytics.m).toBe('last-click');

    // Set initial cookie using Playwright's cookie API
    await page.context().addCookies([
      {
        name: 'dub_id',
        value: 'initial-id',
        path: '/',
        domain: 'localhost',
      },
    ]);

    // Visit ?via=derek
    const [response1] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/track/click')),
      page.goto('/?via=derek'),
    ]);

    let responseBody = await response1.json();
    let clickId = responseBody.clickId;

    // Verify cookie is set with derek's click ID
    const cookies = await page.context().cookies();
    const dubIdCookie = cookies.find((cookie) => cookie.name === 'dub_id');
    expect(dubIdCookie).toBeDefined();
    expect(dubIdCookie?.value).toEqual(clickId);

    // Visit ?via=derekforbes
    const [response2] = await Promise.all([
      page.waitForResponse((req) => req.url().includes('/track/click')),
      page.goto('/?via=derekforbes'),
    ]);

    responseBody = await response2.json();
    clickId = responseBody.clickId;

    // Verify cookie is updated with derekforbes's click ID
    const updatedCookies = await page.context().cookies();
    const updatedDubIdCookie = updatedCookies.find(
      (cookie) => cookie.name === 'dub_id',
    );
    expect(updatedDubIdCookie).toBeDefined();
    expect(updatedDubIdCookie?.value).toEqual(clickId);

    await page.context().clearCookies();
  });
});
