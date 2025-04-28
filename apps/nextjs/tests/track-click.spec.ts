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

test('should fire /track/click and set cookies when ?via= is present', async ({
  page,
}) => {
  const via = 'derek';

  const [request, response] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url().includes('/track/click') && request.method() === 'POST',
    ),

    page.waitForResponse(
      (response) =>
        response.url().includes('/track/click') && response.status() === 200,
    ),

    page.goto(`/?via=${via}`),
  ]);

  const postData = JSON.parse(request.postData() || '{}');
  expect(postData).toMatchObject({
    domain: expect.any(String),
    key: via,
    url: expect.any(String),
    referrer: expect.any(String),
  });

  const responseData = await response.json();

  // Wait for the cookies to be set
  await expect(async () => {
    const cookies = await page.context().cookies();

    // Check if the dub_id cookie is set
    const dubIdCookie = cookies.find((cookie) => cookie.name === 'dub_id');
    expect(dubIdCookie).toBeDefined();
    expect(dubIdCookie?.value).toBe(responseData.clickId);

    // Check if the dub_partner_data cookie is set
    const partnerDataCookie = cookies.find(
      (cookie) => cookie.name === 'dub_partner_data',
    );
    expect(partnerDataCookie).toBeDefined();
    const partnerDataCookieValue = JSON.parse(partnerDataCookie?.value || '{}');
    expect(partnerDataCookieValue).toMatchObject({
      ...responseData,
      partner: {
        ...responseData.partner,
        name: encodeURIComponent(responseData.partner.name),
        image: encodeURIComponent(responseData.partner.image),
      },
    });
  }).toPass({ timeout: 5000 });
});
