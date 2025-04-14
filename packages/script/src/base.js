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

    delete(key) {
      const deleteOptions = { ...COOKIE_OPTIONS };
      deleteOptions.expires = 'Thu, 01 Jan 1970 00:00:00 GMT';

      const cookieString = Object.entries(deleteOptions)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      document.cookie = `${key}=; ${cookieString}`;
    },
  };

  const setPartnerData = (data) => {
    const existingPartnerData = cookieManager.get(DUB_PARTNER_COOKIE);

    if (existingPartnerData) {
      try {
        const partnerData = JSON.parse(existingPartnerData);

        if (data.clickId === partnerData.clickId) {
          return;
        }

        cookieManager.delete(DUB_PARTNER_COOKIE);
      } catch (error) {
        cookieManager.delete(DUB_PARTNER_COOKIE);
      }
    }

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
          setPartnerData(data);
        }
      });
  }

  // Initialize tracking
  function init() {
    const params = new URLSearchParams(location.search);

    const shouldSetCookie = (clickId) => {
      const existingClickId = cookieManager.get(DUB_ID_VAR);

      // only set cookie if there's no existing click id
      // or if the attribution model is last-click and the new click id is different from the existing one
      return (
        !existingClickId ||
        (ATTRIBUTION_MODEL === 'last-click' && clickId !== existingClickId)
      );
    };

    // Direct click ID in URL
    const clickId = params.get(DUB_ID_VAR);
    if (clickId && shouldSetCookie(clickId)) {
      cookieManager.set(DUB_ID_VAR, clickId);
    }

    // Track via query param
    if (QUERY_PARAM_VALUE && SHORT_DOMAIN) {
      if (shouldSetCookie(clickId)) {
        trackClick(QUERY_PARAM_VALUE);
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
