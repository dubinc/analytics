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
  const processQueuedEvents = (queue) => {
    if (!queue || !Array.isArray(queue)) {
      return;
    }

    console.debug(
      '[dubAnalytics] Processing queued conversion events:',
      queue.length,
    );

    queue.forEach(([method, ...args]) => {
      if (method === 'trackLead') {
        console.debug('[dubAnalytics] Processing queued trackLead:', args);
        trackLead(...args);
      } else if (method === 'trackSale') {
        console.debug('[dubAnalytics] Processing queued trackSale:', args);
        trackSale(...args);
      }
    });
  };

  if (window.dubAnalytics) {
    const original = window.dubAnalytics;
    const existingQueue = original.q || [];

    function dubAnalytics(method, ...args) {
      console.debug('[dubAnalytics] Called with method:', method, args);

      if (method === 'trackLead') {
        trackLead(...args);
      } else if (method === 'trackSale') {
        trackSale(...args);
      } else if (method === 'ready') {
        // Handle ready callback
        const callback = args[0];
        if (typeof callback === 'function') {
          callback();
        }
      } else {
        // Delegate to original dubAnalytics for other methods
        if (original && typeof original === 'function') {
          original(method, ...args);
        } else {
          console.warn('[dubAnalytics] Unknown method:', method);
        }
      }
    }

    // Preserve the existing queue
    dubAnalytics.q = existingQueue;

    // Add conversion tracking methods
    dubAnalytics.trackLead = function (...args) {
      trackLead(...args);
    };

    dubAnalytics.trackSale = function (...args) {
      trackSale(...args);
    };

    // Process existing queued events that are conversion-related
    processQueuedEvents(existingQueue);

    // Replace window.dubAnalytics with the enhanced version
    window.dubAnalytics = {
      ...original,
      ...dubAnalytics,
    };
  } else {
    // If dubAnalytics doesn't exist yet, create it
    window.dubAnalytics = function (method, ...args) {
      if (method === 'trackLead') {
        trackLead(...args);
      } else if (method === 'trackSale') {
        trackSale(...args);
      } else if (method === 'ready') {
        const callback = args[0];
        if (typeof callback === 'function') {
          callback();
        }
      } else {
        console.warn('[dubAnalytics] Unknown method:', method);
      }
    };

    window.dubAnalytics.q = [];
    window.dubAnalytics.trackLead = function (...args) {
      trackLead(...args);
    };
    window.dubAnalytics.trackSale = function (...args) {
      trackSale(...args);
    };
  }

  // Alternative approach: Hook into the base script's queue manager if available
  // This provides better integration with the existing queue system
  if (window._dubAnalytics && window._dubAnalytics.queueManager) {
    const originalProcess = window._dubAnalytics.queueManager.process;

    window._dubAnalytics.queueManager.process = function ({ method, args }) {
      if (method === 'trackLead') {
        trackLead(...args);
      } else if (method === 'trackSale') {
        trackSale(...args);
      } else {
        // Call original process for other methods
        originalProcess.call(this, { method, args });
      }
    };
  }
};

// Run when base script is ready
if (window._dubAnalytics) {
  initClientConversionTracking();
} else {
  window.addEventListener('load', initClientConversionTracking);
}
