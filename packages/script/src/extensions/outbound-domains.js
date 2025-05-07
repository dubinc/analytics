// Wait for base script to initialize
const initOutboundDomains = () => {
  const {
    c: cookieManager,
    i: DUB_ID_VAR,
    h: HOSTNAME,
    n: DOMAINS_CONFIG,
  } = window._dubAnalytics;
  let outboundLinksUpdated = new Set(); // Track processed links

  function addOutboundTracking(clickId) {
    // Parse comma-separated outbound domains
    const outboundDomains = DOMAINS_CONFIG.outbound
      ?.split(',')
      .map((d) => d.trim());
    if (!outboundDomains?.length) return;

    const currentDomain = HOSTNAME.replace(/^www\./, '');
    const filteredDomains = outboundDomains.filter((d) => d !== currentDomain);

    const existingCookie = clickId || cookieManager.get(DUB_ID_VAR);
    if (!existingCookie) return;

    // Create selectors for both links and iframes
    const selectors = filteredDomains
      .map((domain) => [`a[href*="${domain}"]`, `iframe[src*="${domain}"]`])
      .flat()
      .join(',');

    const elements = document.querySelectorAll(selectors);
    if (!elements || elements.length === 0) return;

    elements.forEach((element) => {
      // Skip already processed elements
      if (outboundLinksUpdated.has(element)) return;

      try {
        const url = new URL(element.href || element.src);
        url.searchParams.set(DUB_ID_VAR, existingCookie);

        // Update the appropriate attribute based on element type
        if (element.tagName.toLowerCase() === 'a') {
          element.href = url.toString();
        } else if (element.tagName.toLowerCase() === 'iframe') {
          element.src = url.toString();
        }

        outboundLinksUpdated.add(element);
      } catch (e) {}
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
