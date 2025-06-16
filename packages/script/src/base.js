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

  // Initialize global DubAnalytics object
  window.DubAnalytics = window.DubAnalytics || {
    partner: null,
    discount: null,
  };

  // Initialize dubAnalytics
  if (window.dubAnalytics) {
    const original = window.dubAnalytics;
    const queue = original.q || [];

    window.dubAnalytics = function (method, ...args) {
      if (method === 'ready') {
        const callback = args[0];
        callback();
      } else if (['trackClick'].includes(method)) {
        trackClick(...args);
      } else {
        console.warn('[dubAnalytics] Unknown method:', method);
      }
    };

    window.dubAnalytics.q = queue;
  }

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

  // Queue management
  const queueManager = {
    queue: window.dubAnalytics?.q || [],

    // Process specific method types (e.g., only 'ready')
    flush(methodFilter) {
      const remainingQueue = [];

      while (this.queue.length) {
        const [method, ...args] = this.queue.shift();

        if (!methodFilter || methodFilter(method)) {
          this.process({ method, args });
        } else {
          remainingQueue.push([method, ...args]);
        }
      }

      this.queue = remainingQueue;
    },

    process({ method, args }) {
      if (method === 'ready') {
        const callback = args[0];
        callback();
      } else if (['trackClick'].includes(method)) {
        trackClick(...args);
      } else {
        console.warn('[dubAnalytics] Unknown method:', method);
      }
    },
  };

  let clientClickTracked = false;

  // Track click and set cookie
  function trackClick({ domain, key }) {
    if (clientClickTracked) return;
    clientClickTracked = true;

    const params = new URLSearchParams(location.search);
    const serverClickId = params.get(DUB_ID_VAR);

    fetch(`${API_HOST}/track/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        key,
        url: window.location.href,
        referrer: document.referrer,
      }),
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data) {
          if (serverClickId && serverClickId !== data.clickId) {
            console.warn(
              `Client-tracked click ID ${data.clickId} does not match server-tracked click ID ${serverClickId}, skipping...`,
            );
            return;
          }
          cookieManager.set(DUB_ID_VAR, data.clickId);
          // if partner data is present, set it as dub_partner_data cookie
          if (data.partner) {
            // Encode only the image URL and name to handle special characters
            const encodedData = {
              ...data,
              partner: {
                ...data.partner,
                name: encodeURIComponent(data.partner.name),
                image: data.partner.image
                  ? encodeURIComponent(data.partner.image)
                  : null,
              },
            };

            cookieManager.set(DUB_PARTNER_COOKIE, JSON.stringify(encodedData));

            DubAnalytics.partner = data.partner;
            DubAnalytics.discount = data.discount;

            queueManager.flush((method) => method === 'ready');
          }

          return data;
        }
      });
  }

  // Initialize tracking
  function init() {
    const params = new URLSearchParams(location.search);

    const shouldSetCookie = () => {
      // only set cookie if there's no existing click id
      // or if the attribution model is last-click
      return (
        !cookieManager.get(DUB_ID_VAR) || ATTRIBUTION_MODEL !== 'first-click'
      );
    };

    // Dub Conversions tracking (via direct click ID in URL)
    const clickId = params.get(DUB_ID_VAR);
    if (clickId && shouldSetCookie()) {
      cookieManager.set(DUB_ID_VAR, clickId);
    }

    // Dub Partners tracking (via query param e.g. ?via=partner_id)
    if (QUERY_PARAM_VALUE && SHORT_DOMAIN && shouldSetCookie()) {
      trackClick({
        domain: SHORT_DOMAIN,
        key: QUERY_PARAM_VALUE,
      });
    }

    // Process the queued methods
    queueManager.flush((method) => method === 'trackClick');

    // Initialize DubAnalytics from cookie if it exists
    const partnerCookie = cookieManager.get(DUB_PARTNER_COOKIE);

    if (partnerCookie) {
      try {
        const partnerData = JSON.parse(partnerCookie);

        DubAnalytics.partner = partnerData.partner;
        DubAnalytics.discount = partnerData.discount;
      } catch (e) {
        console.error('[DubAnalytics] Failed to parse partner cookie:', e);
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
  };

  // Initialize
  init();
})();
