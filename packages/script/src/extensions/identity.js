const initIdentity = () => {
  const {
    a: API_HOST,
    c: cookieManager,
    i: DUB_ID_VAR,
    pc: DUB_PARTNER_COOKIE,
    h: HOSTNAME,
    s: script,
    p: getPendingClick,
  } = window._dubAnalytics || {};

  const IDENTITY_PATHS = (() => {
    const identityPaths = script.getAttribute('data-track-identity-paths');

    if (!identityPaths) return [];

    try {
      const paths = JSON.parse(identityPaths);

      return Array.isArray(paths)
        ? paths.filter((path) => typeof path === 'string')
        : [];
    } catch (error) {
      console.warn(
        '[dubAnalytics] Failed to parse data-track-identity-paths.',
        error,
      );
      return [];
    }
  })();

  let pendingIdentity;
  let identityAgent;

  function matchesIdentityPath(pathname) {
    const normalize = (path) =>
      path.length > 1 ? path.replace(/\/+$/, '') : path;
    const current = normalize(pathname);

    return IDENTITY_PATHS.some((path) => {
      if (path.endsWith('/*')) {
        const base = normalize(path.slice(0, -2));

        return (
          base === '' || current === base || current.startsWith(`${base}/`)
        );
      }

      return current === normalize(path);
    });
  }

  // The Fingerprint agent lives in identity-agent.js, next to this script, so it only loads when needed
  function loadIdentityAgent() {
    identityAgent =
      identityAgent ||
      new Promise((resolve, reject) => {
        const agent = document.createElement('script');
        agent.src = new URL('identity-agent.js', script.src).href;
        agent.async = true;
        agent.onload = () => resolve(window._dubIdentity);
        agent.onerror = () => {
          identityAgent = undefined;
          reject(new Error('Failed to load identity-agent.js'));
        };
        document.head.appendChild(agent);
      });

    return identityAgent;
  }

  // A ?via= partner click stores its /track/click response, clickId included, in dub_partner_data
  function getPartnerClickId() {
    try {
      return JSON.parse(cookieManager.get(DUB_PARTNER_COOKIE) || 'null')
        ?.clickId;
    } catch (error) {
      return undefined;
    }
  }

  // The cookie domains this page can write, most specific first: host-only, .app.example.com, .example.com
  function cookieDomains() {
    const parts = HOSTNAME.split('.');

    return [
      undefined,
      ...parts.slice(0, -1).map((_, i) => `.${parts.slice(i).join('.')}`),
    ];
  }

  function hasCookie(name, value) {
    return document.cookie
      .split(';')
      .some((cookie) => cookie.trim() === `${name}=${value}`);
  }

  // dub_id can come from a parent domain, for a click on example.com and a signup on app.example.com.
  // So write each domain level, most specific first, and stop when no bare copy is left to keep the original scope.
  // The default COOKIE_OPTIONS domain is not used here, because on www.example.com it is .example.com.
  function setIdentifiedClickId(clickId, visitorId) {
    const identifiedClickId = `${clickId}_${visitorId}`;

    for (const domain of cookieDomains()) {
      if (!hasCookie(DUB_ID_VAR, clickId)) return;

      cookieManager.set(DUB_ID_VAR, identifiedClickId, { domain });
    }
  }

  // Links the visitor's device to their click once, then suffixes dub_id with the visitorId
  async function identifyClick() {
    await getPendingClick().catch(() => undefined);

    const clickId = cookieManager.get(DUB_ID_VAR);

    // Click ids never contain "_", so a suffixed dub_id is already identified
    if (!clickId || clickId.includes('_')) {
      return;
    }

    // Fingerprint is only for partner clicks, so skip ad and site-visit clicks, and clicks newer than the partner data
    if (getPartnerClickId() !== clickId) {
      return;
    }

    const identity = await loadIdentityAgent();
    const visitorId = await identity.identify({
      apiHost: API_HOST,
      clickId,
    });

    // Skip when a new click replaced dub_id while identifying
    if (visitorId && cookieManager.get(DUB_ID_VAR) === clickId) {
      setIdentifiedClickId(clickId, visitorId);
    }
  }

  // Concurrent calls share one run, and failures never reach the caller
  function trackIdentity() {
    pendingIdentity =
      pendingIdentity ||
      identifyClick()
        .catch((error) => {
          console.warn('[dubAnalytics] trackIdentity failed.', error);
        })
        .then(() => {
          pendingIdentity = undefined;
        });

    return pendingIdentity;
  }

  // Identifies on the first page load and on client-side navigation to a matching path
  function watchIdentityPaths() {
    if (!IDENTITY_PATHS.length) return;

    let lastPathname;

    const check = () => {
      const { pathname } = window.location;

      if (pathname === lastPathname) return;

      lastPathname = pathname;

      if (matchesIdentityPath(pathname)) {
        trackIdentity();
      }
    };

    const pushState = history.pushState.bind(history);
    const replaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      pushState(...args);
      check();
    };

    history.replaceState = (...args) => {
      replaceState(...args);
      check();
    };

    window.addEventListener('popstate', check);

    check();
  }

  // Add method to the global dubAnalytics object for direct calls
  if (window.dubAnalytics) {
    window.dubAnalytics.trackIdentity = function () {
      return trackIdentity();
    };
  }

  // Process any existing queued trackIdentity calls
  if (window._dubAnalytics && window._dubAnalytics.qm) {
    const queueManager = window._dubAnalytics.qm;
    const existingQueue = queueManager.queue || [];

    const remainingQueue = existingQueue.filter(([method]) => {
      if (method === 'trackIdentity') {
        trackIdentity();
        return false;
      }

      return true;
    });

    queueManager.queue = remainingQueue;
  }

  watchIdentityPaths();
};

// Run when base script is ready
if (window._dubAnalytics) {
  initIdentity();
} else {
  window.addEventListener('load', initIdentity);
}
