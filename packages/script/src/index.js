(function () {
  const IDENTIFIER = 'dclid';

  // Utility function to get a cookie by name
  function getCookie(name) {
    let cookieArray = document.cookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      let cookiePair = cookieArray[i].split('=');
      if (name == cookiePair[0].trim()) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null;
  }

  // Utility function to set a cookie
  function setCookie(name, value) {
    document.cookie = name + '=' + (value || '') + '; path=/';
  }

  // Function to check for IDENTIFIER param in the URL and update cookie if necessary
  function watchForId() {
    const urlParams = new URLSearchParams(window.location.search);
    const dclid = urlParams.get(IDENTIFIER);
    if (dclid && !getCookie(IDENTIFIER)) {
      setCookie(IDENTIFIER, dclid, 365); // Save for 1 year
    }
  }

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

  // The track function which sends data to your backend
  function track(eventName, properties = {}) {
    // API endpoint where the tracking data is sent
    const dubApiTrackEndpoint = 'https://api.dub.co/analytics/track';

    const dclid = getCookie(IDENTIFIER);
    if (!dclid) {
      // If dclid is not found, return because we can't track without it
      return;
    }

    // Make the API request
    fetch(dubApiTrackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        properties: properties,
        dclid: dclid,
        apiKey: apiKey,
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
  window.da = { track };

  // Check for dclid on page load
  watchForId();

  // Listen for URL changes in case of SPA where the page doesn't reload
  window.addEventListener('popstate', watchForId);
  window.addEventListener('pushState', watchForId);
  window.addEventListener('replaceState', watchForId);

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
