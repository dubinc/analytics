(function () {
  // Store script reference for extensions
  const script = document.currentScript;

  const DUB_ID_VAR = 'dub_id';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const HOSTNAME = window.location.hostname;

  // Common script attributes
  const API_HOST = script.getAttribute('data-api-host') || 'https://api.dub.co';
  const COOKIE_OPTIONS = (() => {
    const defaultOptions = {
      domain:
        HOSTNAME === 'localhost'
          ? undefined
          : `.${HOSTNAME.replace(/^www\./, '')}`,
      path: '/',
      sameSite: 'Lax',
      expires: new Date(Date.now() + COOKIE_EXPIRES).toUTCString(),
    };

    const opts = script.getAttribute('data-cookie-options');
    if (!opts) return defaultOptions;

    const parsedOpts = JSON.parse(opts);
    if (parsedOpts.expiresInDays) {
      parsedOpts.expires = new Date(
        Date.now() + parsedOpts.expiresInDays * 24 * 60 * 60 * 1000,
      ).toUTCString();
      delete parsedOpts.expiresInDays;
    }

    return { ...defaultOptions, ...parsedOpts };
  })();
  const SHORT_DOMAIN =
    script.getAttribute('data-short-domain') ||
    script.getAttribute('data-domain');
  const ATTRIBUTION_MODEL =
    script.getAttribute('data-attribution-model') || 'last-click';

  // Cookie management
  const cookieManager = {
    get(key) {
      return document.cookie
        .split(';')
        .map((c) => c.trim().split('='))
        .find(([k]) => k === key)?.[1];
    },

    set(key, value) {
      const cookieString = Object.entries(COOKIE_OPTIONS)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      document.cookie = `${key}=${value}; ${cookieString}`;
    },
  };

  let clientClickTracked = false;
  // Track click and set cookie
  function trackClick(identifier) {
    if (clientClickTracked) return;
    clientClickTracked = true;

    fetch(`${API_HOST}/track/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: SHORT_DOMAIN,
        key: identifier,
        url: window.location.href,
        referrer: document.referrer,
      }),
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data) {
          cookieManager.set(DUB_ID_VAR, data.clickId);
        }
      });
  }

  // Initialize tracking
  function init() {
    const params = new URLSearchParams(window.location.search);
    const queryParam = script.getAttribute('data-query-param') || 'via';

    // Direct click ID in URL
    const clickId = params.get(DUB_ID_VAR);
    if (clickId) {
      cookieManager.set(DUB_ID_VAR, clickId);
      return;
    }

    // Track via query param
    const identifier = params.get(queryParam);
    if (identifier && SHORT_DOMAIN) {
      const existingCookie = cookieManager.get(DUB_ID_VAR);
      if (!existingCookie || ATTRIBUTION_MODEL !== 'first-click') {
        trackClick(identifier);
      }
    }
  }

  // Export core functionality
  window._dubAnalytics = {
    script,
    cookieManager,
    DUB_ID_VAR,
    HOSTNAME,
    API_HOST,
    COOKIE_OPTIONS,
    SHORT_DOMAIN,
    ATTRIBUTION_MODEL,
  };

  // Initialize
  init();
})();
