// Wait for base script to initialize
const initSiteVisit = () => {
  const { DUB_ID_VAR, cookie, script } = window._dubAnalytics;
  let siteVisitTracked = false;

  function trackSiteVisit() {
    const apiHost =
      script.getAttribute('data-api-host') || 'https://api.dub.co';
    const siteShortDomain = script.getAttribute('data-site-short-domain');

    // Return early if siteShortDomain is not set or if visit already tracked
    if (!siteShortDomain || siteVisitTracked) return;
    siteVisitTracked = true;

    // Only track if no existing cookie
    if (!cookie.get(DUB_ID_VAR)) {
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
          if (data.clickId) {
            const cookieOptions = script.getAttribute('data-cookie-options');
            cookie.set(
              DUB_ID_VAR,
              data.clickId,
              cookieOptions ? JSON.parse(cookieOptions) : null,
            );
          }
        });
    }
  }

  trackSiteVisit();
};

// Run when base script is ready
if (window._dubAnalytics) {
  initSiteVisit();
} else {
  window.addEventListener('load', initSiteVisit);
}
