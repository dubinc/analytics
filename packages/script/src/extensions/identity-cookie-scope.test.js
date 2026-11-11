// @vitest-environment-options {"url": "https://app.example.com/signup"}
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SOURCE = [
  readFileSync(join(__dirname, '../base.js'), 'utf8'),
  readFileSync(join(__dirname, 'identity.js'), 'utf8'),
].join('\n');
const CLICK_ID = 'kVrpHmuNu8Q9VpBG';
const VISITOR_ID = 'Uxk0Swb1Ofgfq2Jcg1cV';
const IDENTIFIED_CLICK_ID = `${CLICK_ID}_${VISITOR_ID}`;
const identify = vi.fn();

function runScript() {
  const script = document.createElement('script');
  script.src = 'https://www.dubcdn.com/analytics/script.identity.js';

  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    get: () => script,
  });

  new Function(SOURCE)();
}

function stubDubAnalytics() {
  window.dubAnalytics = function () {
    (window.dubAnalytics.q = window.dubAnalytics.q || []).push(arguments);
  };
}

// A ?via= partner click on the given domain sets dub_id and dub_partner_data there
function setPartnerClick(domain) {
  document.cookie = `dub_id=${CLICK_ID}; path=/; domain=${domain}`;
  document.cookie = `dub_partner_data=${JSON.stringify({
    clickId: CLICK_ID,
    partner: { id: 'pn_1', name: 'Partner', image: null },
  })}; path=/; domain=${domain}`;
}

function dubIdValues() {
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .filter(([name]) => name === 'dub_id')
    .map(([, value]) => value);
}

function clearCookies() {
  ['', '; domain=.app.example.com', '; domain=.example.com'].forEach(
    (scope) => {
      ['dub_id', 'dub_partner_data'].forEach((name) => {
        document.cookie = `${name}=; path=/; max-age=0${scope}`;
      });
    },
  );
}

describe('identity extension cookie scope', () => {
  beforeEach(() => {
    clearCookies();
    stubDubAnalytics();
    identify.mockResolvedValue(VISITOR_ID);

    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      window._dubIdentity = { identify };
      setTimeout(() => node.onload());
      return node;
    });
  });

  afterEach(() => {
    clearCookies();
    delete window._dubIdentity;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('suffixes a dub_id set on the parent domain, so no bare copy is left', async () => {
    setPartnerClick('.example.com');

    runScript();
    await window.dubAnalytics.trackIdentity();

    expect(dubIdValues()).not.toContain(CLICK_ID);
    expect(window._dubAnalytics.c.get('dub_id')).toBe(IDENTIFIED_CLICK_ID);
  });

  it('identifies a parent domain click only once', async () => {
    setPartnerClick('.example.com');

    runScript();
    await window.dubAnalytics.trackIdentity();
    await window.dubAnalytics.trackIdentity();

    expect(identify).toHaveBeenCalledTimes(1);
  });

  it('keeps a host-only dub_id on www to one cookie, with no parent-domain copy', async () => {
    // eslint-disable-next-line no-undef
    jsdom.reconfigure({ url: 'https://www.example.com/signup' });

    try {
      document.cookie = `dub_id=${CLICK_ID}; path=/`;
      document.cookie = `dub_partner_data=${JSON.stringify({
        clickId: CLICK_ID,
        partner: { id: 'pn_1', name: 'Partner', image: null },
      })}; path=/`;

      runScript();
      await window.dubAnalytics.trackIdentity();

      expect(dubIdValues()).toEqual([IDENTIFIED_CLICK_ID]);
    } finally {
      ['dub_id', 'dub_partner_data'].forEach((name) => {
        document.cookie = `${name}=; path=/; max-age=0`;
      });
      // eslint-disable-next-line no-undef
      jsdom.reconfigure({ url: 'https://app.example.com/signup' });
    }
  });

  it('keeps a dub_id set on this subdomain to one cookie', async () => {
    setPartnerClick('.app.example.com');

    runScript();
    await window.dubAnalytics.trackIdentity();

    expect(dubIdValues()).toEqual([IDENTIFIED_CLICK_ID]);
  });
});
