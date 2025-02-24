// Wait for base script to initialize
const initSiteVisit = () => {
  const {
    c: cookieManager,
    i: DUB_ID_VAR,
    a: API_HOST,
    d: SHORT_DOMAIN,
    v: QUERY_PARAM_VALUE,
    n: DOMAINS_CONFIG,
  } = window._dubAnalytics;

  let siteVisitTracked = false;

  function trackSiteVisit() {
    const siteShortDomain = DOMAINS_CONFIG.site;
    if (!siteShortDomain || siteVisitTracked) return;
    siteVisitTracked = true;

    // Don't track if we have a query param for click tracking
    if (QUERY_PARAM_VALUE && SHORT_DOMAIN) return;

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
