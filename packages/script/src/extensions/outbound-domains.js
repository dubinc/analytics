(function () {
  const { CLICK_ID, cookie, HOSTNAME } = window._dubAnalytics;
  let outboundLinksUpdated = false;

  function addOutboundTracking(clickId) {
    if (outboundLinksUpdated) return;

    const script = document.currentScript;
    const outboundDomainsAttr = script.getAttribute('data-outbound-domains');
    if (!outboundDomainsAttr) return;

    const outboundDomains = outboundDomainsAttr.split(',').map((d) => d.trim());
    if (outboundDomains.length === 0) return;

    const existingCookie = clickId || cookie.get(CLICK_ID);
    if (!existingCookie) return;

    const currentDomain = HOSTNAME.replace(/^www\./, '');
    const filteredDomains = outboundDomains.filter((d) => d !== currentDomain);

    const selector = filteredDomains
      .map((domain) => `a[href*="${domain}"]`)
      .join(',');
    const links = document.querySelectorAll(selector);

    if (!links || links.length === 0) return;

    links.forEach((link) => {
      try {
        const url = new URL(link.href);
        url.searchParams.set(CLICK_ID, existingCookie);
        link.href = url.toString();
      } catch (e) {}
    });

    outboundLinksUpdated = true;
  }

  addOutboundTracking();

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
})();
