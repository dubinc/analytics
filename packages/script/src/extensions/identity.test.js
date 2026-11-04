import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BASE_SOURCE = readFileSync(join(__dirname, '../base.js'), 'utf8');
const SOURCE = [
  BASE_SOURCE,
  readFileSync(join(__dirname, 'identity.js'), 'utf8'),
].join('\n');
const SCRIPT_SRC = 'https://www.dubcdn.com/analytics/script.identity.js';
const CLICK_ID = 'kVrpHmuNu8Q9VpBG';
const VISITOR_ID = 'Uxk0Swb1Ofgfq2Jcg1cV';
const IDENTIFIED_CLICK_ID = `${CLICK_ID}_${VISITOR_ID}`;

const { pushState, replaceState } = window.history;
const addEventListener = window.addEventListener.bind(window);
const popstateListeners = [];
const fetchMock = vi.fn();
const identify = vi.fn();

function runScript(attributes = {}, source = SOURCE) {
  const script = document.createElement('script');
  script.src = SCRIPT_SRC;

  Object.entries(attributes).forEach(([name, value]) => {
    script.setAttribute(name, value);
  });

  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    get: () => script,
  });

  new Function(source)();
}

function stubDubAnalytics() {
  window.dubAnalytics = function () {
    (window.dubAnalytics.q = window.dubAnalytics.q || []).push(arguments);
  };
}

function loadedIdentityScripts() {
  return [...document.head.querySelectorAll('script')].map(
    (script) => script.src,
  );
}

function clearCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}

function getCookie(name) {
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
}

function flush() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('identity extension', () => {
  beforeEach(() => {
    clearCookies();
    document.head.innerHTML = '';
    stubDubAnalytics();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (type, listener, options) => {
        if (type === 'popstate') {
          popstateListeners.push(listener);
        }

        addEventListener(type, listener, options);
      },
    );

    identify.mockResolvedValue(VISITOR_ID);

    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      document.head.append(node);

      if (node.src.endsWith('/identity-agent.js')) {
        window._dubIdentity = {
          identify,
        };
        setTimeout(() => node.onload());
      }

      return node;
    });
  });

  afterEach(() => {
    popstateListeners.splice(0).forEach((listener) => {
      window.removeEventListener('popstate', listener);
    });
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
    replaceState.call(window.history, null, '', '/');
    delete window._dubIdentity;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('loads identity-agent.js next to the script and identifies the click on a matching path', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', '/signup');

    runScript({
      'data-api-host': 'https://api.example.com',
      'data-identity-paths': JSON.stringify(['/signup']),
    });

    await vi.waitFor(() => {
      expect(getCookie('dub_id')).toBe(IDENTIFIED_CLICK_ID);
    });

    expect(loadedIdentityScripts()).toEqual([
      'https://www.dubcdn.com/analytics/identity-agent.js',
    ]);
    expect(identify).toHaveBeenCalledWith({
      apiHost: 'https://api.example.com',
      clickId: CLICK_ID,
    });
  });

  it.each([
    ['/signup/', ['/signup']],
    ['/checkout', ['/checkout/*']],
    ['/checkout/plan/pro', ['/checkout/*']],
    ['/anything', ['/*']],
  ])('identifies on %s for paths %j', async (pathname, paths) => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', pathname);

    runScript({
      'data-identity-paths': JSON.stringify(paths),
    });

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ['/', ['/signup']],
    ['/signup/step-2', ['/signup']],
    ['/signup-old', ['/signup']],
    ['/checkouts', ['/checkout/*']],
  ])('skips %s for paths %j', async (pathname, paths) => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', pathname);

    runScript({
      'data-identity-paths': JSON.stringify(paths),
    });
    await flush();

    expect(loadedIdentityScripts()).toEqual([]);
  });

  it('is not part of variants without the identity extension', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', '/signup');

    runScript(
      {
        'data-identity-paths': JSON.stringify(['/signup']),
      },
      BASE_SOURCE,
    );
    await flush();

    expect(window.dubAnalytics.trackIdentity).toBeUndefined();
    expect(loadedIdentityScripts()).toEqual([]);
  });

  it('does nothing without data-identity-paths', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript();
    await flush();

    expect(loadedIdentityScripts()).toEqual([]);
  });

  it('ignores data-identity-paths that is not an array of paths', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', '/signup');

    expect(() =>
      runScript({
        'data-identity-paths': JSON.stringify('/signup'),
      }),
    ).not.toThrow();
    expect(() =>
      runScript({
        'data-identity-paths': JSON.stringify([42, '/signup']),
      }),
    ).not.toThrow();

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });
  });

  it('skips loading identity-agent.js without a dub_id cookie', async () => {
    replaceState.call(window.history, null, '', '/signup');

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });
    await flush();

    expect(loadedIdentityScripts()).toEqual([]);
  });

  it('skips when dub_id is already suffixed with a visitorId', async () => {
    document.cookie = `dub_id=${IDENTIFIED_CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', '/signup');

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });
    await flush();

    expect(loadedIdentityScripts()).toEqual([]);
  });

  it('identifies a ?dub_id= click that carries a visitorId suffix', async () => {
    replaceState.call(
      window.history,
      null,
      '',
      `/signup?dub_id=${CLICK_ID}_otherVisitorId`,
    );

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });

    await vi.waitFor(() => {
      expect(getCookie('dub_id')).toBe(IDENTIFIED_CLICK_ID);
    });
  });

  it('identifies a new ?via= click that replaced an identified dub_id', async () => {
    document.cookie = 'dub_id=oldClickId_oldVisitorId; path=/';
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          clickId: CLICK_ID,
        }),
      ),
    );
    replaceState.call(window.history, null, '', '/signup?via=partner');

    runScript({
      'data-domains': JSON.stringify({
        refer: 'dub.sh',
      }),
      'data-identity-paths': JSON.stringify(['/signup']),
    });

    await vi.waitFor(() => {
      expect(getCookie('dub_id')).toBe(IDENTIFIED_CLICK_ID);
    });
    expect(identify).toHaveBeenCalledWith(
      expect.objectContaining({
        clickId: CLICK_ID,
      }),
    );
  });

  it('keeps a new click that replaced dub_id while identifying', async () => {
    identify.mockImplementation(async () => {
      document.cookie = 'dub_id=newClickId; path=/';
      return VISITOR_ID;
    });
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript();
    await window.dubAnalytics.trackIdentity();

    expect(getCookie('dub_id')).toBe('newClickId');
  });

  it('waits for a ?via= click before identifying', async () => {
    let resolveClick;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveClick = resolve;
      }),
    );
    replaceState.call(window.history, null, '', '/signup?via=partner');

    runScript({
      'data-domains': JSON.stringify({
        refer: 'dub.sh',
      }),
      'data-identity-paths': JSON.stringify(['/signup']),
    });
    await flush();

    expect(loadedIdentityScripts()).toEqual([]);

    resolveClick(
      new Response(
        JSON.stringify({
          clickId: CLICK_ID,
        }),
      ),
    );

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledWith(
        expect.objectContaining({
          clickId: CLICK_ID,
        }),
      );
    });
  });

  it('keeps dub_id unchanged when identification fails', async () => {
    identify.mockResolvedValue(null);
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', '/signup');

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });
    await flush();

    expect(getCookie('dub_id')).toBe(CLICK_ID);
  });

  it('never throws when identity-agent.js fails to load', async () => {
    document.head.appendChild.mockImplementation((node) => {
      document.head.append(node);
      setTimeout(() => node.onerror());
      return node;
    });
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript();

    await expect(window.dubAnalytics.trackIdentity()).resolves.toBeUndefined();
    expect(getCookie('dub_id')).toBe(CLICK_ID);
  });

  it('identifies after a client-side navigation to a matching path', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });
    await flush();

    expect(loadedIdentityScripts()).toEqual([]);

    window.history.pushState(null, '', '/signup');

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });
  });

  it('identifies when going back to a matching path', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });
    await flush();

    replaceState.call(window.history, null, '', '/signup');
    window.dispatchEvent(new PopStateEvent('popstate'));

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });
  });

  it('ignores history updates that keep the same path', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    replaceState.call(window.history, null, '', '/signup');

    runScript({
      'data-identity-paths': JSON.stringify(['/signup']),
    });
    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });

    clearCookies();
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    window.history.replaceState(null, '', '/signup?step=2');
    await flush();

    expect(identify).toHaveBeenCalledTimes(1);
  });

  it('exposes trackIdentity on window.dubAnalytics without paths', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript();
    await window.dubAnalytics.trackIdentity();

    expect(identify).toHaveBeenCalledTimes(1);
    expect(getCookie('dub_id')).toBe(IDENTIFIED_CLICK_ID);
  });

  it('runs a trackIdentity call queued before the script loaded', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    window.dubAnalytics('trackIdentity');

    runScript();

    await vi.waitFor(() => {
      expect(identify).toHaveBeenCalledTimes(1);
    });
  });

  it('shares one identification between concurrent calls', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    runScript();
    await Promise.all([
      window.dubAnalytics.trackIdentity(),
      window.dubAnalytics.trackIdentity(),
    ]);

    expect(identify).toHaveBeenCalledTimes(1);
    expect(loadedIdentityScripts()).toHaveLength(1);
  });
});
