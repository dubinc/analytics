(function () {
  const CLICK_ID = 'dub_id';
  const OLD_CLICK_ID = 'dclid';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days
  const defaultOptions = {
    domain: null,
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

    const cv = script.getAttribute('data-cookie-options');
    const av = script.getAttribute('data-attribution-model');

    return {
      cookieOptions: cv ? JSON.parse(cv) : null,
      attributionModel: av || 'last-click',
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

  // Function to check for {keys} in the URL and update cookie if necessary
  function watchForQueryParam() {
    const searchParams = new URLSearchParams(window.location.search);
    const { cookieOptions, attributionModel } = getOptions(script);

    const clickId =
      searchParams.get(CLICK_ID) || searchParams.get(OLD_CLICK_ID);

    if (!clickId) {
      return;
    }

    const cookie = getCookie(CLICK_ID) || getCookie(OLD_CLICK_ID);

    if (!cookie || attributionModel === 'last-click') {
      if (cookie !== clickId) {
        setCookie(CLICK_ID, clickId, cookieOptions);
        setCookie(OLD_CLICK_ID, clickId, cookieOptions);
      }
    }
  }

  watchForQueryParam();

  // Listen for URL changes in case of SPA where the page doesn't reload
  window.addEventListener('popstate', watchForQueryParam);
  window.addEventListener('pushState', watchForQueryParam);
  window.addEventListener('replaceState', watchForQueryParam);

  // For single page applications, also observe for pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    watchForQueryParam();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    watchForQueryParam();
  };
})();
