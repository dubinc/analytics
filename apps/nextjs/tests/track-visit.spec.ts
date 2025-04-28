import { test, expect } from '@playwright/test';

test('should fire /track/visit and set dub_id cookie when data-domains.site is set', async ({
  page,
}) => {
  const [request, response] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url().includes('/track/visit') && request.method() === 'POST',
    ),

    page.waitForResponse(
      (response) =>
        response.url().includes('/track/visit') && response.status() === 200,
    ),

    page.goto('/'),
  ]);

  const postData = JSON.parse(request.postData() || '{}');
  expect(postData).toMatchObject({
    domain: expect.any(String),
    url: expect.any(String),
    referrer: expect.any(String),
  });

  const responseData = await response.json();

  // Wait for the dub_id cookie to be set
  await expect(async () => {
    const cookies = await page.context().cookies();
    const dubIdCookie = cookies.find((cookie) => cookie.name === 'dub_id');

    expect(dubIdCookie).toBeDefined();
    expect(dubIdCookie?.value).toBe(responseData.clickId);
  }).toPass({ timeout: 5000 });
});
