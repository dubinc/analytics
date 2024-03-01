(function () {
  const CLICK_ID = 'dclid';
  const AFFILIATE_COOKIE = 'daff';
  const AFFILIATE_PARAM_KEY = 'via';

  function getScript() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('dubScript.js')) {
        return scripts[i];
      }
    }
    return null;
  }

  function getApiKey(script) {
    return script.getAttribute('data-api-key');
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
  const apiKey = getApiKey(script);
  if (!apiKey) {
    console.error('[Dub Web Analytics] API key not found.');
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
  function setCookie(key, value) {
    document.cookie = key + '=' + (value || '') + '; path=/';
  }

  // Function to check for {keys} in the URL and update cookie if necessary
  function watchForQueryParam() {
    const keys = [
      { query: CLICK_ID, cookie: CLICK_ID },
      { query: affiliateParamKey, cookie: AFFILIATE_COOKIE },
    ];
    const searchParams = new URLSearchParams(window.location.search);
    keys.forEach((key) => {
      const param = searchParams.get(key.query);
      if (param && !getCookie(key.cookie)) {
        setCookie(key.cookie, param);
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
    const dubApiTrackEndpoint = getTrackEndpoint(script);
    if (!dubApiTrackEndpoint) {
      console.error('[Dub Web Analytics] API endpoint not found.');
      return;
    }

    const clickId = getCookie(CLICK_ID);
    if (clickId) {
      // If click id was found, return because we don't want to track the same click twice
      return;
    }

    // Make the API request
    fetch(`${dubApiTrackEndpoint}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        url: url,
        affiliateParamKey: affiliateParamKey,
        sdkVersion: getSDKVersion(script),
        timestamp: new Date().getTime(),
      }),
    })
      .then((response) => {
        const body = response.json();
        if (response.status === 200) {
          setCookie(CLICK_ID, body.clickId);
        }
      })
      .catch((error) =>
        console.error(
          '[Dub Web Analytics] Error sending tracking data:',
          error,
        ),
      );
  }

  function trackConversion(eventName, properties = {}) {
    // API endpoint where the tracking data is sent
    const dubApiTrackEndpoint = getTrackEndpoint(script);
    if (!dubApiTrackEndpoint) {
      console.error('[Dub Web Analytics] API endpoint not found.');
      return;
    }

    const clickId = getCookie(CLICK_ID);
    if (!clickId) {
      // If click id was not found, return because we can't track without it
      return;
    }

    // Make the API request
    fetch(`${dubApiTrackEndpoint}/conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        eventName: eventName,
        properties: properties,
        clickId: clickId,
        affiliateUsername: getCookie(AFFILIATE_COOKIE),
        sdkVersion: getSDKVersion(script),
        timestamp: new Date().getTime(),
      }),
    })
      .then((response) => response.json())
      .catch((error) =>
        console.error(
          '[Dub Web Analytics] Error sending tracking data:',
          error,
        ),
      );
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
