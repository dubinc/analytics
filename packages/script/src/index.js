(function () {
  const CLICK_ID = 'dub_id';
  const OLD_CLICK_ID = 'dclid';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const HOSTNAME = window.location.hostname;

  const defaultOptions = {
    domain:
      HOSTNAME === 'localhost'
        ? undefined
        : // Remove 'www.' from the hostname (because we want to set the cookie on the root domain)
          `.${HOSTNAME.replace(/^www\./, '')}`,
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

    const ah = script.getAttribute('data-api-host');
    const am = script.getAttribute('data-attribution-model');
    const co = script.getAttribute('data-cookie-options');
    const qp = script.getAttribute('data-query-param');
    const d = script.getAttribute('data-domain');

    return {
      apiHost: ah || 'https://api.dub.co',
      domain: d || undefined,
      attributionModel: am || 'last-click',
      cookieOptions: co ? JSON.parse(co) : null,
      queryParam: qp || 'via',
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

  function checkCookieAndSet(clickId) {
    const { cookieOptions, attributionModel } = getOptions(script);

    const cookie = getCookie(CLICK_ID) || getCookie(OLD_CLICK_ID);

    // If the cookie is not set
    // or the cookie is set and is not the same as the clickId + attribution model is 'last-click'
    // then set the cookie
    if (!cookie || (cookie !== clickId && attributionModel === 'last-click')) {
      setCookie(CLICK_ID, clickId, cookieOptions);
      setCookie(OLD_CLICK_ID, clickId, cookieOptions);
    }
  }

  // Function to check for { keys } in the URL and update cookie if necessary
  function watchForQueryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const { apiHost, domain, queryParam } = getOptions(script);

    // When the clickId is present in the URL, set the cookie (?dub_id=...)
    let clickId = searchParams.get(CLICK_ID) || searchParams.get(OLD_CLICK_ID);

    if (clickId) {
      checkCookieAndSet(clickId);
      return;
    }

    // When the identifier is present in the URL, track the click and set the cookie
    const identifier = searchParams.get(queryParam);

    if (!identifier) {
      return;
    }

    if (!domain) {
      console.warn(
        '[Dub Analytics] Matching identifier detected but domain is not specified, which is required for tracking clicks. Please set the `domain` option, or clicks will not be tracked.',
      );
      return;
    }

    fetch(`${apiHost}/track/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        key: identifier,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const { error } = await res.json();
        console.error(
          `[Dub Analytics] Failed to track click: ${error.message}`,
        );
        return;
      }

      if (res.status === 204) {
        console.warn(
          `[Dub Analytics] Link does not exist for identifier: ${identifier}. Click not tracked.`,
        );
        return;
      }

      const { clickId } = await res.json(); // Response: { clickId: string }
      checkCookieAndSet(clickId);
    });
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
