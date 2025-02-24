(function () {
  const DUB_ID_VAR = 'dub_id';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const HOSTNAME = window.location.hostname;
  let clientClickTracked = false;

  // Store script reference for extensions
  const script = document.currentScript;

  // Cookie management
  const cookie = {
    get(key) {
      return document.cookie
        .split(';')
        .map((c) => c.trim().split('='))
        .find(([k]) => k === key)?.[1];
    },

    set(key, value, options = {}) {
      const defaultOptions = {
        domain:
          HOSTNAME === 'localhost'
            ? undefined
            : `.${HOSTNAME.replace(/^www\./, '')}`,
        path: '/',
        sameSite: 'Lax',
        expires: new Date(Date.now() + COOKIE_EXPIRES).toUTCString(),
      };

      const opts = { ...defaultOptions, ...options };
      const cookieString = Object.entries(opts)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      document.cookie = `${key}=${value}; ${cookieString}`;
    },
  };

  // Track click and set cookie
  function trackClick(identifier) {
    if (clientClickTracked) return;
    clientClickTracked = true;

    const apiHost =
      script.getAttribute('data-api-host') || 'https://api.dub.co';
    const shortDomain =
      script.getAttribute('data-short-domain') ||
      script.getAttribute('data-domain');

    fetch(`${apiHost}/track/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: shortDomain,
        key: identifier,
        url: window.location.href,
        referrer: document.referrer,
      }),
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data) {
          const cookieOptions = script.getAttribute('data-cookie-options');
          cookie.set(
            DUB_ID_VAR,
            data.clickId,
            cookieOptions ? JSON.parse(cookieOptions) : null,
          );
        }
      });
  }

  // Initialize tracking
  function init() {
    const params = new URLSearchParams(window.location.search);
    const shortDomain =
      script.getAttribute('data-short-domain') ||
      script.getAttribute('data-domain');
    const queryParam = script.getAttribute('data-query-param') || 'via';
    const attributionModel =
      script.getAttribute('data-attribution-model') || 'last-click';

    // Direct click ID in URL
    const clickId = params.get(DUB_ID_VAR);
    if (clickId) {
      const cookieOptions = script.getAttribute('data-cookie-options');
      cookie.set(
        DUB_ID_VAR,
        clickId,
        cookieOptions ? JSON.parse(cookieOptions) : null,
      );
      return;
    }

    // Track via query param
    const identifier = params.get(queryParam);
    if (identifier && shortDomain) {
      const existingCookie = cookie.get(DUB_ID_VAR);
      if (!existingCookie || attributionModel !== 'first-click') {
        trackClick(identifier);
      }
    }
  }

  // Export core functionality
  window._dubAnalytics = {
    DUB_ID_VAR,
    HOSTNAME,
    cookie,
    script, // Export script reference
  };

  // Initialize
  init();
})();
