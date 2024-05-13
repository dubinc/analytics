(function () {
  const CLICK_ID = 'dclid';
  const COOKIE_EXPIRES = 90 * 24 * 60 * 60 * 1000; // 90 days

  function getScript() {
    const scripts = document.querySelectorAll('script');

    for (let i = 0; i < scripts.length; i++) {
      if (
        scripts[i].src &&
        scripts[i].src.includes('dubcdn.com/analytics/script.js')
      ) {
        return true;
      }
    }

    return null;
  }

  function getCookieOptions(script) {
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
    // options: domain, expires, httpOnly, maxAge, path, sameSite, secure
    document.cookie = `${key}=${value}; ${options.domain ? `domain=${options.domain}; ` : ''}${options.expires ? `expires=${options.expires}; ` : ''}${options.httpOnly ? 'httpOnly; ' : ''}${options.maxAge ? `max-age=${options.maxAge}; ` : ''}${options.path ? `path=${options.path}; ` : ''}${options.sameSite ? `sameSite=${options.sameSite}; ` : ''}${options.secure ? 'secure;' : ''}`;
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
