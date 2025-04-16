(function () {
  // Store script reference for extensions
  const script = document.currentScript;

  const DUB_ID_VAR = 'dub_id';
  const DUB_PARTNER_COOKIE = 'dub_partner_data';
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
    // here, we fetch the old data-short-domain in case it's needed
    const oldReferDomain = script.getAttribute('data-short-domain');
    // latest format with data-domains
    const domainsAttr = script.getAttribute('data-domains');
    if (domainsAttr) {
      try {
        const domainsConfig = JSON.parse(domainsAttr);
        return {
          ...domainsConfig,
          // we should use the domainsConfig.refer if it exists,
          // otherwise we fallback to the old data-short-domain if it exists
          refer: domainsConfig.refer || oldReferDomain,
        };
      } catch (e) {
        // Fall back to old format if JSON parse fails
      }
    }
    // Backwards compatibility only for data-short-domain
    return {
      refer: oldReferDomain,
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
  function trackClick(event) {
    if (clientClickTracked) {
      return;
    }

    clientClickTracked = true;

    fetch(`${API_HOST}/track/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: window.location.href,
        referrer: document.referrer,
        ...event,
      }),
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data) {
          cookieManager.set(DUB_ID_VAR, data.clickId);
          // if partner data is present, set it as dub_partner_data cookie
          if (data.partner) {
            // Encode only the image URL and name to handle special characters
            const encodedData = {
              ...data,
              partner: {
                ...data.partner,
                name: encodeURIComponent(data.partner.name),
                image: encodeURIComponent(data.partner.image),
              },
            };

            cookieManager.set(DUB_PARTNER_COOKIE, JSON.stringify(encodedData));
          }
        }
      });
  }

  const shouldSetCookie = () => {
    // only set cookie if there's no existing click id
    // or if the attribution model is last-click
    return (
      !cookieManager.get(DUB_ID_VAR) || ATTRIBUTION_MODEL !== 'first-click'
    );
  };

  // Initialize tracking
  function init() {
    const params = new URLSearchParams(location.search);

    // Dub Conversions tracking (via direct click ID in URL)
    const clickId = params.get(DUB_ID_VAR);
    if (clickId && shouldSetCookie()) {
      cookieManager.set(DUB_ID_VAR, clickId);
    }

    // Dub Partners tracking (via query param e.g. ?via=partner_id)
    if (QUERY_PARAM_VALUE && SHORT_DOMAIN && shouldSetCookie()) {
      trackClick(QUERY_PARAM_VALUE);
    }
  }

  // Expose trackClick to the outside world
  function handleClickEvent(event) {
    if (shouldSetCookie()) {
      trackClick(event);
    }
  }

  // Process any events (eg: trackClick) queued before script loaded
  const existingQueue = window.dubAnalyticsQueue || [];
  window.dubAnalyticsQueue = [];

  function processQueue() {
    const combinedQueue = [...existingQueue, ...window.dubAnalyticsQueue];

    existingQueue.length = 0;
    window.dubAnalyticsQueue.length = 0;

    if (combinedQueue.length === 0) {
      return;
    }

    for (const item of combinedQueue) {
      if (item && item.method === 'trackClick' && item.args) {
        console.log('processing queue item', item);
        handleClickEvent.apply(null, item.args);
      }
    }
  }

  // Export minimal API with minified names
  window.dubAnalytics = {
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
    trackClick: handleClickEvent,
  };

  // Initialize
  init();

  // Process any events (eg: trackClick) queued before script loaded
  processQueue();
})();
