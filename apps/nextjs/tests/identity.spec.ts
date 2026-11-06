import { DUB_ANALYTICS_SCRIPT_URL } from '@/app/constants';
import { expect, test, type Page } from '@playwright/test';

// The folder of the build the other specs use
const BUILD_URL = DUB_ANALYTICS_SCRIPT_URL.replace(/script[^/]*\.js$/, '');
const SITE = 'http://identity.test';
const CLICK_ID = 'idE2EClick01';
const VISITOR_ID = 'idE2EVisitor01';

// Serves a page on a test origin that loads the identity variant for /signup
async function serveSite(page: Page) {
  await page.route(`${SITE}/**`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html>
        <html>
          <head>
            <script>
              (function (w, da) {
                w[da] = w[da] || function () { (w[da].q = w[da].q || []).push(arguments); };
                ['trackClick', 'trackLead', 'trackSale', 'trackIdentity'].forEach(function (m) {
                  w[da][m] = function () { (w[da].q = w[da].q || []).push([m, ...Array.from(arguments)]); };
                });
              })(window, 'dubAnalytics');
            </script>
            <script
              src="${SITE}/analytics/script.identity.js"
              defer
              data-domains='{"refer":"dub.sh"}'
              data-identity-paths='["/signup"]'
            ></script>
          </head>
          <body>Identity test</body>
        </html>`,
    }),
  );

  // Chromium blocks a public origin from loading a script from localhost, so the build is fetched here and served from the test origin.
  // Registered after the page route, because Playwright tries the newest matching route first.
  await page.route(`${SITE}/analytics/**`, async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').pop();
    const response = await route.fetch({ url: `${BUILD_URL}${file}` });

    await route.fulfill({ response });
  });
}

// Stubs the Fingerprint agent, so the spec checks the script without calling Fingerprint or Dub
async function stubIdentityAgent(page: Page) {
  const agentRequests: string[] = [];

  await page.route('**/analytics/identity-agent.js', (route) => {
    agentRequests.push(route.request().url());

    return route.fulfill({
      contentType: 'application/javascript',
      body: `window._dubIdentity = { identify: async () => '${VISITOR_ID}' };`,
    });
  });

  return agentRequests;
}

async function getDubId(page: Page) {
  const cookies = await page.context().cookies(SITE);

  return cookies.find((cookie) => cookie.name === 'dub_id')?.value;
}

test.describe('Identity tracking', () => {
  test('identifies a ?via= partner click on a matching path', async ({
    page,
  }) => {
    await serveSite(page);
    const agentRequests = await stubIdentityAgent(page);

    await page.route('**/track/click', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          clickId: CLICK_ID,
          partner: { id: 'pn_e2e', name: 'Partner', image: null },
          discount: null,
        }),
      }),
    );

    await page.goto(`${SITE}/signup?via=partner`);

    await expect.poll(() => getDubId(page)).toBe(`${CLICK_ID}_${VISITOR_ID}`);
    expect(agentRequests).toHaveLength(1);
  });

  test('never loads the agent for a click without partner data', async ({
    page,
  }) => {
    await serveSite(page);
    const agentRequests = await stubIdentityAgent(page);

    await page.goto(`${SITE}/signup?dub_id=${CLICK_ID}`);
    await expect.poll(() => getDubId(page)).toBe(CLICK_ID);

    await page.evaluate(() => (window as any).dubAnalytics.trackIdentity());

    expect(agentRequests).toHaveLength(0);
    expect(await getDubId(page)).toBe(CLICK_ID);
  });
});
