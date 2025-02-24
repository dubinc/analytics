// Wait for base script to initialize
const initSiteVisit = () => {
  const {
    script,
    cookieManager,
    DUB_ID_VAR,
    API_HOST, // Use shared API_HOST
  } = window._dubAnalytics;

  let siteVisitTracked = false;

  function trackSiteVisit() {
    const siteShortDomain = script.getAttribute('data-site-short-domain');
    if (!siteShortDomain || siteVisitTracked) return;
    siteVisitTracked = true;

    if (!cookieManager.get(DUB_ID_VAR)) {
      fetch(`${API_HOST}/track/visit`, {
        // Use shared API_HOST
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
            cookieManager.set(DUB_ID_VAR, data.clickId);
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
