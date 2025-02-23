(function () {
  const CLICK_ID = 'dub_id';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const HOSTNAME = window.location.hostname;
  let clientClickTracked = false;

  const defaultCookieOptions = {
    domain:
      HOSTNAME === 'localhost'
        ? undefined
        : `.${HOSTNAME.replace(/^www\./, '')}`,
    httpOnly: false,
    path: '/',
    sameSite: 'Lax',
    secure: false,
    maxAge: COOKIE_EXPIRES,
    expires: new Date(Date.now() + COOKIE_EXPIRES),
  };

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

  function setCookie(key, value, options) {
    const { domain, expires, httpOnly, maxAge, path, sameSite, secure } = {
      ...defaultCookieOptions,
      ...options,
      ...(options &&
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

  function getOptions(script) {
    if (!script) {
      return null;
    }

    const ah = script.getAttribute('data-api-host');
    const am = script.getAttribute('data-attribution-model');
    const co = script.getAttribute('data-cookie-options');
    const qp = script.getAttribute('data-query-param');
    const sd =
      script.getAttribute('data-short-domain') ||
      script.getAttribute('data-domain');
    const ssd = script.getAttribute('data-site-short-domain');
    const od = script.getAttribute('data-outbound-domains');

    return {
      apiHost: ah || 'https://api.dub.co',
      shortDomain: sd || undefined,
      siteShortDomain: ssd || undefined,
      outboundDomains: od ? od.split(',').map((d) => d.trim()) : undefined,
      attributionModel: am || 'last-click',
      cookieOptions: co ? JSON.parse(co) : null,
      queryParam: qp || 'via',
    };
  }

  function checkCookieAndSet(clickId) {
    const { cookieOptions, attributionModel } = getOptions(
      document.currentScript,
    );
    const cookie = getCookie(CLICK_ID);

    if (!cookie || (cookie !== clickId && attributionModel === 'last-click')) {
      setCookie(CLICK_ID, clickId, cookieOptions);
    }
  }

  function watchForQueryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const { apiHost, shortDomain, queryParam, attributionModel } = getOptions(
      document.currentScript,
    );

    // When the clickId is present in the URL, set the cookie (?dub_id=...)
    const clickId = searchParams.get(CLICK_ID);
    if (clickId) {
      checkCookieAndSet(clickId);
      return;
    }

    // When the query param identifier is present in the URL, track the click and set the cookie
    const queryParamIdentifier = searchParams.get(queryParam);

    // if both identifier and shortDomain are present, then we proceed with tracking the click
    if (queryParamIdentifier && shortDomain) {
      // Prevent duplicate click tracking requests
      if (clientClickTracked) {
        return;
      }
      clientClickTracked = true;

      // no need to track the click if the cookie is already set and the attribution model is 'first-click'
      const cookie = getCookie(CLICK_ID);
      if (cookie && attributionModel === 'first-click') {
        return;
      }

      fetch(`${apiHost}/track/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: shortDomain,
          key: queryParamIdentifier,
          url: window.location.href,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          return;
        }
        const { clickId } = await res.json();
        checkCookieAndSet(clickId);
      });
    }
  }

  // Export core functions for use in extensions
  window._dubAnalytics = {
    CLICK_ID,
    COOKIE_EXPIRES,
    HOSTNAME,
    getCookie,
    setCookie,
    getOptions,
    checkCookieAndSet,
  };

  // Initialize query param tracking
  watchForQueryParams();

  // Listen for URL changes in case of SPA
  window.addEventListener('popstate', watchForQueryParams);

  // For single page applications, monkey-patch History API methods
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
