(function () {
  const CLICK_ID = 'dclid';
  const COOKIE_EXPIRES = 60 * 24 * 60 * 60 * 1000; // 60 days

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
  function setCookie(key, value, expires) {
    document.cookie =
      key + '=' + (value || '') + '; path=/; expires=' + expires;
  }

  // Function to check for {keys} in the URL and update cookie if necessary
  function watchForQueryParam() {
    const keys = [{ query: CLICK_ID, cookie: CLICK_ID }];
    const searchParams = new URLSearchParams(window.location.search);
    const expires = new Date(Date.now() + COOKIE_EXPIRES).toUTCString();
    keys.forEach((key) => {
      const param = searchParams.get(key.query);
      if (param && !getCookie(key.cookie)) {
        setCookie(key.cookie, param, expires);
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
