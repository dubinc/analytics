(function () {
  const { getOptions, CLICK_ID, getCookie, HOSTNAME } = window._dubAnalytics;
  let outboundLinksUpdated = false;

  function addOutboundTracking(clickId) {
    if (outboundLinksUpdated) {
      return;
    }

    let { outboundDomains } = getOptions(document.currentScript);

    if (!outboundDomains || outboundDomains.length === 0) {
      return;
    }

    const cookie = clickId || getCookie(CLICK_ID);

    if (!cookie) {
      return;
    }

    const currentDomain = HOSTNAME.replace(/^www\./, '');

    outboundDomains = outboundDomains.filter((d) => d !== currentDomain);

    const selector = outboundDomains
      .map((domain) => `a[href*="${domain}"]`)
      .join(',');

    if (!selector || selector.length === 0) {
      return;
    }

    const links = document.querySelectorAll(selector);

    if (!links || links.length === 0) {
      return;
    }

    links.forEach((link) => {
      try {
        const url = new URL(link.href);
        url.searchParams.set(CLICK_ID, cookie);
        link.href = url.toString();
      } catch (e) {}
    });

    outboundLinksUpdated = true;
  }

  addOutboundTracking();

  // Add SPA support
  window.addEventListener('popstate', () => {
    addOutboundTracking();
  });

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
