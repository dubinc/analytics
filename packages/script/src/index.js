(function () {
  const CLICK_ID = 'dub_id';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const HOSTNAME = window.location.hostname;
  let crossDomainLinksUpdated = false;

  const defaultCookieOptions = {
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
    const od = script.getAttribute('data-outbound-domains');

    return {
      apiHost: ah || 'https://api.dub.co',
      shortDomain: sd || undefined,
      outboundDomains: od ? od.split(',').map((d) => d.trim()) : undefined,
      attributionModel: am || 'last-click',
      cookieOptions: co ? JSON.parse(co) : null,
      queryParam: qp || 'via',
    };
  }

  const script = document.currentScript;
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
      ...defaultCookieOptions,
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

    const cookie = getCookie(CLICK_ID);

    // If the cookie is not set
    // or the cookie is set and is not the same as the clickId + attribution model is 'last-click'
    // then set the cookie
    if (!cookie || (cookie !== clickId && attributionModel === 'last-click')) {
      setCookie(CLICK_ID, clickId, cookieOptions);
    }
  }

  // Add click tracking to cross-domain links
  function addClickTrackingToLinks(clickId) {
    if (crossDomainLinksUpdated) {
      return;
    }

    let { outboundDomains } = getOptions(script);

    if (!outboundDomains || outboundDomains.length === 0) {
      return;
    }

    const cookie = clickId || getCookie(CLICK_ID);

    if (!cookie) {
      return;
    }

    const currentDomain = HOSTNAME.replace(/^www\./, '');

    outboundDomains = outboundDomains.filter((d) => d !== currentDomain);

    const selector = outboundDomains
      .map((domain) => `a[href*="${domain}"]`)
      .join(',');

    if (!selector || selector.length === 0) {
      return;
    }

    const links = document.querySelectorAll(selector);

    if (!links || links.length === 0) {
      return;
    }

    links.forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set(CLICK_ID, cookie);
      link.href = url.toString();
    });

    crossDomainLinksUpdated = true;
  }

  // Function to check for { keys } in the URL and update cookie if necessary
  function watchForQueryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const { apiHost, shortDomain, queryParam } = getOptions(script);

    // When the clickId is present in the URL, set the cookie (?dub_id=...)
    const clickId = searchParams.get(CLICK_ID);

    if (clickId) {
      checkCookieAndSet(clickId);
      addClickTrackingToLinks(clickId);
      return;
    }

    // When the identifier is present in the URL, track the click and set the cookie
    const identifier = searchParams.get(queryParam);

    if (!identifier) {
      return;
    }

    if (!shortDomain) {
      console.warn(
        '[Dub Analytics] Matching `queryParam` identifier detected but `shortDomain` is not specified, which is required for tracking clicks. Please set the `shortDomain` option, or clicks will not be tracked.',
      );
      return;
    }

    fetch(`${apiHost}/track/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: shortDomain,
        key: identifier,
        url: window.location.href,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const { error } = await res.json();
        console.error(
          `[Dub Analytics] Failed to track click: ${error.message}`,
        );
        return;
      }
      const { clickId } = await res.json(); // Response: { clickId: string }
      checkCookieAndSet(clickId);
      addClickTrackingToLinks(clickId);
    });
  }

  watchForQueryParams();
  addClickTrackingToLinks();

  // Listen for URL changes in case of SPA where the page doesn't reload
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
