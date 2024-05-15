(function () {
  const CLICK_ID = 'dclid';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days

  function getScript() {
    const scripts = document.querySelectorAll('script');

    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.includes('index.js')) {
        return scripts[i];
      }
    }

    return null;
  }

  function getCookieOptions(script) {
    if (!script) {
      return null;
    }

    const v = script.getAttribute('data-cookie-options');
    return v ? JSON.parse(v) : null;
  }

  const script = getScript();
  if (!script) {
    console.error('[Dub Web Analytics] Script not found.');
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
    const defaultOptions = {
      domain: null,
      httpOnly: false,
      path: '/',
      sameSite: 'Lax',
      secure: false,
      maxAge: COOKIE_EXPIRES,
      expires: new Date(Date.now() + COOKIE_EXPIRES),
    };

    const { domain, expires, httpOnly, maxAge, path, sameSite, secure } = {
      ...defaultOptions,
      ...options,
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
    const keys = [{ query: CLICK_ID, cookie: CLICK_ID }];
    const searchParams = new URLSearchParams(window.location.search);
    const cookieOptions = getCookieOptions(script);
    keys.forEach((key) => {
      const param = searchParams.get(key.query);
      if (param && !getCookie(key.cookie)) {
        setCookie(key.cookie, param, cookieOptions);
      }
    });
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
    watchForId();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    watchForId();
  };
})();
