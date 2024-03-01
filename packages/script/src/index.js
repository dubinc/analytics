(function () {
  const CLICK_ID_KEY = 'dclid';

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
  const affiliateParamKey = getAffiliateParamKey(script);

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

  // Function to check for {key} param in the URL and update cookie if necessary
  function watchForQueryParam() {
    const paramKeys = [CLICK_ID_KEY, affiliateParamKey];
    const params = new URLSearchParams(window.location.search);
    paramKeys.forEach((key) => {
      const param = params.get(key);
      if (param && !getCookie(key)) {
        setCookie(key, param, 365); // Save for 1 year
      }
    });
  }

  const handleInitialClickTracking = () => {
    const via = getCookie(affiliateParamKey);
    if (via) {
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

    const clickId = getCookie(CLICK_ID_KEY);
    if (!clickId) {
      // If click id was not found, return because we can't track without it
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
        clickId: clickId,
        url: url,
        sdkVersion: getSDKVersion(script),
        timestamp: new Date().getTime(),
      }),
    })
      .then((response) => {
        const body = response.json();
        if (response.status === 200) {
          setCookie(CLICK_ID_KEY, body.click_id);
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

    const clickId = getCookie(CLICK_ID_KEY);
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
