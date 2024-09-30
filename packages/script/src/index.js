(function () {
  const CLICK_ID = 'dub_id';
  const OLD_CLICK_ID = 'dclid';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const HOSTNAME = window.location.hostname;

  const defaultOptions = {
    domain: HOSTNAME === 'localhost' ? undefined : `.${HOSTNAME}`,
    httpOnly: false,
    path: '/',
    sameSite: 'Lax',
    secure: false,
    maxAge: COOKIE_EXPIRES,
    expires: new Date(Date.now() + COOKIE_EXPIRES),
  };

  function getScript() {
    const scripts = document.querySelectorAll('script');

    for (let i = 0; i < scripts.length; i++) {
      if (
        scripts[i].src &&
        (scripts[i].src.includes('dubcdn.com/analytics/script.js') || // production script
          scripts[i].src.includes('.dub-cdn.pages.dev/analytics/script.js')) // staging script
      ) {
        return scripts[i];
      }
    }

    return null;
  }

  function getOptions(script) {
    if (!script) {
      return null;
    }

    const api = script.getAttribute('data-api');
    const am = script.getAttribute('data-attribution-model');
    const co = script.getAttribute('data-cookie-options');
    const qp = script.getAttribute('data-query-param');

    return {
      api: api || 'https://api.dub.co/track/click',
      attributionModel: am || 'last-click',
      cookieOptions: co ? JSON.parse(co) : null,
      queryParam: qp || 'ref',
    };
  }

  const script = getScript();
  if (!script) {
    console.error('[Dub Analytics] Script not found.');
    return;
  }

  // Utility function to get a cookie by key
  function getCookie(key) {
    let cookieArray = document.cookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      let cookiePair = cookieArray[i].split('=');
      if (key == cookiePair[0].trim()) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null;
  }

  // Utility function to set a cookie
  function setCookie(key, value, options) {
    const { domain, expires, httpOnly, maxAge, path, sameSite, secure } = {
      ...defaultOptions,
      ...options,

      ...(options &&
        // If expiresInDays is set, calculate the expires date
        options.expiresInDays && {
          expires: new Date(
            Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000,
          ),
        }),
    };

    const cookieString = Object.entries({
      domain,
      expires: new Date(expires).toUTCString(),
      httpOnly,
      maxAge,
      path,
      sameSite,
      secure,
    })
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');

    document.cookie = `${key}=${value}; ${cookieString}`;
  }

  // Function to check for { keys } in the URL and update cookie if necessary
  function watchForQueryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const { api, cookieOptions, attributionModel, queryParam } =
      getOptions(script);

    let clickId = searchParams.get(CLICK_ID) || searchParams.get(OLD_CLICK_ID);

    if (!clickId) {
      const identifier = searchParams.get(queryParam);

      if (identifier) {
        fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: window.location.hostname,
            identifier,
          }),
        }).then((res) => {
          const data = res.json(); // Response: { clickId: string }

          clickId = data.clickId;
        });
      }

      if (!clickId) {
        return;
      }
    }

    const cookie = getCookie(CLICK_ID) || getCookie(OLD_CLICK_ID);

    if (!cookie || attributionModel === 'last-click') {
      if (cookie !== clickId) {
        setCookie(CLICK_ID, clickId, cookieOptions);
        setCookie(OLD_CLICK_ID, clickId, cookieOptions);
      }
    }
  }

  watchForQueryParams();

  // Listen for URL changes in case of SPA where the page doesn't reload
  window.addEventListener('popstate', watchForQueryParams);
  window.addEventListener('pushState', watchForQueryParams);
  window.addEventListener('replaceState', watchForQueryParams);

  // For single page applications, also observe for pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    watchForQueryParams();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    watchForQueryParams();
  };
})();
