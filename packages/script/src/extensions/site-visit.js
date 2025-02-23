(function () {
  const { CLICK_ID, cookie, script } = window._dubAnalytics;
  let siteVisitTracked = false;

  function trackSiteVisit() {
    const apiHost =
      script.getAttribute('data-api-host') || 'https://api.dub.co';
    const siteShortDomain = script.getAttribute('data-site-short-domain');

    // Return early if siteShortDomain is not set or if visit already tracked
    if (!siteShortDomain || siteVisitTracked) return;
    siteVisitTracked = true;

    // Only track if no existing cookie
    if (!cookie.get(CLICK_ID)) {
      fetch(`${apiHost}/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: siteShortDomain,
          url: window.location.href,
          referrer: document.referrer,
        }),
      })
        .then((res) => res.ok && res.json())
        .then((data) => {
          if (data) {
            const cookieOptions = script.getAttribute('data-cookie-options');
            cookie.set(
              CLICK_ID,
              data.clickId,
              cookieOptions ? JSON.parse(cookieOptions) : null,
            );
          }
        });
    }
  }

  trackSiteVisit();
})();
