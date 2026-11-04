const initIdentity = () => {
  const {
    a: API_HOST,
    c: cookieManager,
    i: DUB_ID_VAR,
    s: script,
    p: getPendingClick,
  } = window._dubAnalytics || {};

  const IDENTITY_PATHS = (() => {
    const identityPaths = script.getAttribute('data-identity-paths');

    if (!identityPaths) return [];

    try {
      const paths = JSON.parse(identityPaths);

      return Array.isArray(paths)
        ? paths.filter((path) => typeof path === 'string')
        : [];
    } catch (error) {
      console.warn(
        '[dubAnalytics] Failed to parse data-identity-paths.',
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

  // Links the visitor's device to their click once, then suffixes dub_id with the visitorId
  async function identifyClick() {
    await getPendingClick().catch(() => undefined);

    const clickId = cookieManager.get(DUB_ID_VAR);

    // Click ids never contain "_", so a suffixed dub_id is already identified
    if (!clickId || clickId.includes('_')) {
      return;
    }

    const identity = await loadIdentityAgent();
    const visitorId = await identity.identify({
      apiHost: API_HOST,
      clickId,
    });

    // Skip when a new click replaced dub_id while identifying
    if (visitorId && cookieManager.get(DUB_ID_VAR) === clickId) {
      cookieManager.set(DUB_ID_VAR, `${clickId}_${visitorId}`);
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
