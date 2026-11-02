const initIdentity = () => {
  const {
    a: API_HOST,
    c: cookieManager,
    i: DUB_ID_VAR,
    s: script,
    p: getPendingClick,
  } = window._dubAnalytics || {};

  const DUB_FID_VAR = 'dub_fid';
  const DUB_FID_MAX_AGE_SECONDS = 30 * 60;

  const IDENTITY_PATHS = (() => {
    const identityPaths = script.getAttribute('data-identity-paths');

    if (!identityPaths) return [];

    try {
      return JSON.parse(identityPaths);
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

  // Links the visitor's device to their click, at most once per click every 30 minutes
  function trackIdentity() {
    pendingIdentity =
      pendingIdentity ||
      getPendingClick()
        .catch(() => undefined)
        .then(() => {
          const clickId = cookieManager.get(DUB_ID_VAR);

          if (!clickId || cookieManager.get(DUB_FID_VAR) === clickId) {
            return;
          }

          return loadIdentityAgent()
            .then((identity) =>
              identity.identify({
                apiHost: API_HOST,
                clickId,
              }),
            )
            .then((identified) => {
              if (identified) {
                document.cookie = `${DUB_FID_VAR}=${clickId}; path=/; max-age=${DUB_FID_MAX_AGE_SECONDS}; SameSite=Lax`;
              }
            });
        })
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
