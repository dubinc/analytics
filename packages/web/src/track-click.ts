import { TrackClickInput } from './types';

declare global {
  interface Window {
    dubAnalytics: {
      trackClick: (event: TrackClickInput) => void;
    };
  }
}

const isAnalyticsReady = (): boolean => {
  return typeof window !== 'undefined' && !!window.dubAnalytics;
};

const waitForAnalytics = (callback: () => void): void => {
  if (isAnalyticsReady()) {
    callback();
    return;
  }

  // If not ready, set up a periodic check
  const interval = setInterval(() => {
    if (isAnalyticsReady()) {
      clearInterval(interval);
      callback();
    }
  }, 100);

  // Stop checking after 10 seconds to prevent infinite checking
  setTimeout(() => clearInterval(interval), 10000);
};

export const trackClick = (event: TrackClickInput) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (isAnalyticsReady()) {
    window.dubAnalytics.trackClick(event);
    return;
  }

  waitForAnalytics(() => {
    window.dubAnalytics.trackClick(event);
  });
};
