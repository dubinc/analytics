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

  const DOMAINS_CONFIG = (() => {
    // Try to get new JSON domains first
    const domainsAttr = script.getAttribute('data-domains');
    if (domainsAttr) {
      try {
        return JSON.parse(domainsAttr);
      } catch (e) {
        // Fall back to old format if JSON parse fails
      }
    }
    // Backwards compatibility only for data-short-domain
    return {
      refer: script.getAttribute('data-short-domain'),
    };
  })();

  const SHORT_DOMAIN = DOMAINS_CONFIG.refer;
  const ATTRIBUTION_MODEL =
    script.getAttribute('data-attribution-model') || 'last-click';
  const QUERY_PARAM = script.getAttribute('data-query-param') || 'via';
  const QUERY_PARAM_VALUE = new URLSearchParams(location.search).get(
    QUERY_PARAM,
  );

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

  const shouldSetCookie = () => {
    return (
      !cookieManager.get(DUB_ID_VAR) || ATTRIBUTION_MODEL !== 'first-click'
    );
  };

  // Initialize tracking
  function init() {
    const params = new URLSearchParams(location.search);

    // Direct click ID in URL
    const clickId = params.get(DUB_ID_VAR);
    if (clickId && shouldSetCookie()) {
      cookieManager.set(DUB_ID_VAR, clickId);
      return;
    }

    // Track via query param
    if (QUERY_PARAM_VALUE && SHORT_DOMAIN) {
      if (shouldSetCookie()) {
        trackClick(QUERY_PARAM_VALUE);
      }
    }
  }

  // Track click
  const existingQueue = window._dubAnalyticsQueue || [];
  window._dubAnalyticsQueue = [];

  function handleClick(identifier) {
    if (shouldSetCookie()) {
      trackClick(identifier);
    }
  }

  // Process any events (eg: trackClick) queued before script loaded
  function processQueue() {
    const combinedQueue = [...existingQueue, ...window._dubAnalyticsQueue];

    existingQueue.length = 0;
    window._dubAnalyticsQueue.length = 0;

    if (combinedQueue.length === 0) {
      return;
    }

    for (const item of combinedQueue) {
      if (item && item.method === 'trackClick' && item.args) {
        handleClick.apply(null, item.args);
      }
    }
  }

  // Export minimal API with minified names
  window._dubAnalytics = {
    c: cookieManager, // was cookieManager
    i: DUB_ID_VAR, // was DUB_ID_VAR
    h: HOSTNAME, // was HOSTNAME
    a: API_HOST, // was API_HOST
    o: COOKIE_OPTIONS, // was COOKIE_OPTIONS
    d: SHORT_DOMAIN, // was SHORT_DOMAIN
    m: ATTRIBUTION_MODEL, // was ATTRIBUTION_MODEL
    p: QUERY_PARAM, // was QUERY_PARAM
    v: QUERY_PARAM_VALUE, // was QUERY_PARAM_VALUE
    n: DOMAINS_CONFIG, // was DOMAINS_CONFIG
    trackClick: handleClick,
  };

  // Initialize
  init();
  processQueue();
})();
