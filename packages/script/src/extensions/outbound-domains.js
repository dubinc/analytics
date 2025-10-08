// Wait for base script to initialize
const initOutboundDomains = () => {
  const {
    c: cookieManager,
    i: DUB_ID_VAR,
    h: HOSTNAME,
    n: DOMAINS_CONFIG,
  } = window._dubAnalytics;
  let outboundLinksUpdated = new Set(); // Track processed links

  function normalizeDomain(domain) {
    return domain.replace(/^www\./, '').trim();
  }

  function isMatchingDomain(url, domain) {
    try {
      const urlHostname = new URL(url).hostname;
      const normalizedUrlHostname = normalizeDomain(urlHostname);
      const normalizedDomain = normalizeDomain(domain);

      // if wildcard domain, check if the url hostname ends with the apex domain
      if (normalizedDomain.startsWith('*.')) {
        const apexDomain = normalizedDomain.slice(2);
        return normalizedUrlHostname.endsWith(`.${apexDomain}`);
      }

      // check for exact match after removing www.
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

    // Also get nested iframes inside srcdoc iframes
    const srcdocIframes = document.querySelectorAll('iframe[srcdoc]');
    const nestedElements = [];

    srcdocIframes.forEach((srcdocIframe) => {
      try {
        // Access the content document of the srcdoc iframe
        const contentDoc = srcdocIframe.contentDocument;
        if (contentDoc) {
          // Find iframes and links inside the srcdoc content
          const nestedIframes = contentDoc.querySelectorAll('iframe[src]');
          const nestedLinks = contentDoc.querySelectorAll('a[href]');

          nestedElements.push(...nestedIframes, ...nestedLinks);
        }
      } catch (e) {
        // contentDocument access might fail due to CORS or other security restrictions
        console.warn('Could not access contentDocument of srcdoc iframe:', e);
      }
    });

    // Combine all elements
    const allElements = [...elements, ...nestedElements];
    if (!allElements || allElements.length === 0) return;

    allElements.forEach((element) => {
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
