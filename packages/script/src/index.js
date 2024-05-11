(function () {
  const CLICK_ID = 'dclid';
  const AFFILIATE_COOKIE = 'daff';
  const AFFILIATE_PARAM_KEY = 'via';
  const COOKIE_EXPIRES = 60 * 24 * 60 * 60 * 1000; // 60 days

  function getScript() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('dubScript.js')) {
        return scripts[i];
      }
    }
    return null;
  }

  function getSDKVersion(script) {
    return script.getAttribute('data-sdkv');
  }

  function getTrackEndpoint(script) {
    return script.getAttribute('data-track-endpoint');
  }

  function getAffiliateParamKey(script) {
    return script.getAttribute('data-affiliate-param-key');
  }

  const script = getScript();
  if (!script) {
    console.error('[Dub Web Analytics] Script not found.');
    return;
  }

  const affiliateParamKey = getAffiliateParamKey(script) || AFFILIATE_PARAM_KEY;

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
    const expires = new Date(Date.now() + COOKIE_EXPIRES).toUTCString();

    const keys = [
      { query: CLICK_ID, cookie: CLICK_ID },
      { query: affiliateParamKey, cookie: AFFILIATE_COOKIE },
    ];
    const searchParams = new URLSearchParams(window.location.search);
    keys.forEach((key) => {
      const param = searchParams.get(key.query);
      if (param && !getCookie(key.cookie)) {
        setCookie(key.cookie, param, expires);
      }
    });
  }

  // If the affiliate cookie is already set, track the initial click
  const handleInitialClickTracking = () => {
    const affiliateCookie = getCookie(AFFILIATE_COOKIE);
    if (affiliateCookie) {
      trackClick(document.location.href);
    }
  };

  function trackClick(url) {
    // API endpoint where the tracking data is sent
  }

  function trackConversion(eventName, properties = {}) {
    // API endpoint where the tracking data is sent
  }

  // Inject the .da object into window with the .track function
  window.da = {
    trackClick,
    trackConversion,
  };

  watchForQueryParam();
  handleInitialClickTracking();

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
