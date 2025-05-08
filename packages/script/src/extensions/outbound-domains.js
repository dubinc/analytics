// Wait for base script to initialize
const initOutboundDomains = () => {
  const {
    c: cookieManager,
    i: DUB_ID_VAR,
    h: HOSTNAME,
    n: DOMAINS_CONFIG,
  } = window._dubAnalytics;
  let outboundLinksUpdated = new Set(); // Track processed links

  console.log('DOMAINS_CONFIG', DOMAINS_CONFIG);

  function normalizeDomain(domain) {
    return domain.replace(/^www\./, '').trim();
  }

  function isMatchingDomain(url, domain) {
    try {
      const urlHostname = new URL(url).hostname;
      const normalizedUrlHostname = normalizeDomain(urlHostname);
      const normalizedDomain = normalizeDomain(domain);

      // Exact match after removing www.
      return normalizedUrlHostname === normalizedDomain;
    } catch (e) {
      return false;
    }
  }

  function addOutboundTracking(clickId) {
    // Handle both string and array configurations for outbound domains
    const outboundDomains = Array.isArray(DOMAINS_CONFIG.outbound)
      ? DOMAINS_CONFIG.outbound
      : DOMAINS_CONFIG.outbound?.split(',').map((d) => d.trim());

    if (!outboundDomains?.length) return;

    const currentDomain = normalizeDomain(HOSTNAME);
    const filteredDomains = outboundDomains
      .map(normalizeDomain)
      .filter((d) => d !== currentDomain);

    const existingCookie = clickId || cookieManager.get(DUB_ID_VAR);
    if (!existingCookie) return;

    // Get all links and iframes
    const elements = document.querySelectorAll('a[href], iframe[src]');
    if (!elements || elements.length === 0) return;

    elements.forEach((element) => {
      // Skip already processed elements
      if (outboundLinksUpdated.has(element)) return;

      try {
        const urlString = element.href || element.src;
        if (!urlString) return;

        // Check if the URL matches any of our outbound domains
        const isOutbound = filteredDomains.some((domain) =>
          isMatchingDomain(urlString, domain),
        );
        if (!isOutbound) return;

        const url = new URL(urlString);

        // Only add the tracking parameter if it's not already present
        if (!url.searchParams.has(DUB_ID_VAR)) {
          url.searchParams.set(DUB_ID_VAR, existingCookie);

          // Update the appropriate attribute based on element type
          if (element.tagName.toLowerCase() === 'a') {
            element.href = url.toString();
          } else if (element.tagName.toLowerCase() === 'iframe') {
            element.src = url.toString();
          }

          outboundLinksUpdated.add(element);
        }
      } catch (e) {
        console.error('Error processing element:', e);
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => addOutboundTracking());
  } else {
    addOutboundTracking();
  }

  // Run periodically to catch dynamically added links
  setInterval(addOutboundTracking, 2000);

  // Add SPA support
  window.addEventListener('popstate', () => addOutboundTracking());

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    addOutboundTracking();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    addOutboundTracking();
  };
};

// Run when base script is ready
if (window._dubAnalytics) {
  initOutboundDomains();
} else {
  window.addEventListener('load', initOutboundDomains);
}
