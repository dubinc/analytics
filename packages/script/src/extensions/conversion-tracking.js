const initConversionTracking = () => {
  const {
    a: API_HOST,
    k: PUBLISHABLE_KEY,
    c: cookieManager,
    i: DUB_ID_VAR,
  } = window._dubAnalytics || {};

  if (!API_HOST) {
    console.warn('[dubAnalytics] Missing API_HOST');
    return;
  }

  if (!PUBLISHABLE_KEY) {
    console.warn('[dubAnalytics] Missing PUBLISHABLE_KEY');
    return;
  }

  // Track lead conversion
  const trackLead = async (input) => {
    const clickId = cookieManager?.get(DUB_ID_VAR);

    const requestBody = {
      ...(clickId && { clickId }),
      ...input,
    };

    const response = await fetch(`${API_HOST}/track/lead/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[dubAnalytics] trackLead failed', result.error);
    }

    return result;
  };

  // Track sale conversion
  const trackSale = async (input) => {
    const response = await fetch(`${API_HOST}/track/sale/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[dubAnalytics] trackSale failed', result.error);
    }

    return result;
  };

  // Add methods to the global dubAnalytics object for direct calls
  if (window.dubAnalytics) {
    window.dubAnalytics.trackLead = function (...args) {
      trackLead(...args);
    };

    window.dubAnalytics.trackSale = function (...args) {
      trackSale(...args);
    };
  }

  // Process any existing queued conversion events
  if (window._dubAnalytics && window._dubAnalytics.qm) {
    const queueManager = window._dubAnalytics.qm;
    const existingQueue = queueManager.queue || [];

    const remainingQueue = existingQueue.filter(([method, ...args]) => {
      if (method === 'trackLead') {
        trackLead(...args);
        return false;
      } else if (method === 'trackSale') {
        trackSale(...args);
        return false;
      }

      return true;
    });

    // Update the queue with remaining items
    queueManager.queue = remainingQueue;
  }
};

// Run when base script is ready
if (window._dubAnalytics) {
  initConversionTracking();
} else {
  window.addEventListener('load', initConversionTracking);
}
