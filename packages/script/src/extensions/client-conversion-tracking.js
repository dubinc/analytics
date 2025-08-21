const initClientConversionTracking = () => {
  console.debug('Running initClientConversionTracking');

  const { a: API_HOST, k: PUBLISHABLE_KEY } = window._dubAnalytics;

  // Track lead conversion
  const trackLead = async (input) => {
    const response = await fetch(`${API_HOST}/track/lead/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(input),
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

    console.debug(
      '[dubAnalytics] Processing existing queue:',
      existingQueue.length,
      'events',
    );

    existingQueue.forEach(([method, ...args]) => {
      if (method === 'trackLead') {
        console.debug('[dubAnalytics] Processing queued trackLead:', args);
        trackLead(...args);
      } else if (method === 'trackSale') {
        console.debug('[dubAnalytics] Processing queued trackSale:', args);
        trackSale(...args);
      }
    });
  }
};

// Run when base script is ready
if (window._dubAnalytics) {
  initClientConversionTracking();
} else {
  window.addEventListener('load', initClientConversionTracking);
}
