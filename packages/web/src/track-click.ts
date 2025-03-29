import { TrackClickInput } from './types';

declare global {
  interface Window {
    dubAnalytics?: {
      trackClick: (event: TrackClickInput) => void;
    };

    _dubAnalyticsQueue?: Array<{
      method: string;
      args: any[];
    }>;
  }
}

export const trackClick = (event: TrackClickInput) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.dubAnalytics?.trackClick) {
    window.dubAnalytics.trackClick(event);
    return;
  }

  if (!window._dubAnalyticsQueue) {
    window._dubAnalyticsQueue = [];
  }

  window._dubAnalyticsQueue.push({
    method: 'trackClick',
    args: [event],
  });
};
