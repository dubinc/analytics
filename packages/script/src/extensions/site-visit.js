(function () {
  const { getOptions, CLICK_ID, getCookie, setCookie } = window._dubAnalytics;
  let siteVisitTracked = false;

  function trackSiteVisit() {
    const { apiHost, cookieOptions, siteShortDomain } = getOptions(
      document.currentScript,
    );

    // Return early if siteShortDomain is not set
    // or if the site visit has already been tracked
    if (!siteShortDomain || siteVisitTracked) {
      return;
    }
    // Set the flag immediately to prevent concurrent calls
    siteVisitTracked = true;

    const cookie = getCookie(CLICK_ID);
    // If the cookie is not set, we can track the site visit
    if (!cookie) {
      fetch(`${apiHost}/track/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: siteShortDomain,
          url: window.location.href,
          referrer: document.referrer,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          return;
        }
        const { clickId } = await res.json();
        setCookie(CLICK_ID, clickId, cookieOptions);
      });
    }
  }

  trackSiteVisit();
})();
