const initClientConversionTracking = () => {
  console.debug('Running initClientConversionTracking');

  const { a: API_HOST, k: PUBLISHABLE_KEY } = window._dubAnalytics;

  console.log({
    API_HOST,
    PUBLISHABLE_KEY,
  });

  // Track lead conversion
  const trackLead = async (input) => {
    console.debug('Calling trackLead', input);

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
    console.debug('Calling trackSale', input);

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

  // Process the queued events
  if (window.dubAnalytics) {
    const original = window.dubAnalytics;
    const queue = original.q || [];

    // Create a callable function
    // Eg: dubAnalytics('trackLead', {});
    function dubAnalytics(method, ...args) {
      if (method === 'trackLead') {
        trackLead(...args);
      } else if (method === 'trackSale') {
        trackSale(...args);
      } else {
        console.warn('[dubAnalytics] Unknown method:', method);
      }
    }

    dubAnalytics.q = queue;

    dubAnalytics.trackLead = function (...args) {
      trackLead(...args);
    };

    dubAnalytics.trackSale = function (...args) {
      trackSale(...args);
    };

    window.dubAnalytics = {
      ...original,
      ...dubAnalytics,
    };
  }
};

// Run when base script is ready
if (window._dubAnalytics) {
  initClientConversionTracking();
} else {
  window.addEventListener('load', initClientConversionTracking);
}
