import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_SOURCE = readFileSync(join(__dirname, '../base.js'), 'utf8');
const CLICK_ID = 'kVrpHmuNu8Q9VpBG';
const IDENTIFIED_CLICK_ID = `${CLICK_ID}_Uxk0Swb1Ofgfq2Jcg1cV`;

const fetchMock = vi.fn();

function runScript(extension, attributes) {
  const script = document.createElement('script');
  script.src = 'https://www.dubcdn.com/analytics/script.js';

  Object.entries(attributes).forEach(([name, value]) => {
    script.setAttribute(name, value);
  });

  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    get: () => script,
  });

  new Function(
    [
      BASE_SOURCE,
      readFileSync(join(__dirname, `${extension}.js`), 'utf8'),
    ].join('\n'),
  )();
}

describe('dub_id suffixed by the identity extension', () => {
  beforeEach(() => {
    window.dubAnalytics = function () {};
    document.cookie = `dub_id=${IDENTIFIED_CLICK_ID}; path=/`;
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));
  });

  afterEach(() => {
    document.cookie = 'dub_id=; path=/; max-age=0';
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each([
    ['trackLead', IDENTIFIED_CLICK_ID],
    ['trackSale', CLICK_ID],
  ])('%s sends %s as the clickId', async (method, clickId) => {
    runScript('conversion-tracking', {
      'data-publishable-key': 'dub_pk_test',
    });

    window.dubAnalytics[method]({
      eventName: 'Sign up',
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).clickId).toBe(clickId);
  });

  it('decorates outbound links with the bare clickId', () => {
    document.body.innerHTML = '<a href="https://app.example.com/signup">Go</a>';

    runScript('outbound-domains', {
      'data-domains': JSON.stringify({
        outbound: ['app.example.com'],
      }),
    });

    expect(document.querySelector('a').href).toBe(
      `https://app.example.com/signup?dub_id=${CLICK_ID}`,
    );
  });

  it('does not track a new click on the next load', () => {
    runScript('site-visit', {
      'data-domains': JSON.stringify({
        site: 'dub.sh',
      }),
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
