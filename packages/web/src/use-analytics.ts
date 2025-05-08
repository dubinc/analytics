import { useCallback, useEffect, useState } from 'react';
import { Discount, Partner, TrackClickInput } from './types';
import { isDubAnalyticsReady } from './utils';

interface PartnerData {
  partner?: Partner | null;
  discount?: Discount | null;
}

declare global {
  interface Window {
    DubAnalytics: PartnerData;
    dubAnalytics: ((event: 'ready', callback: () => void) => void) & {
      trackClick: (event: TrackClickInput) => void;
    };
  }
}

/**
 * Hook to access Dub Web Analytics data including partner and discount information.
 * @returns Object containing partner data, and discount information.
 * ```js
 * import { useAnalytics } from '@dub/analytics/react';
 *
 * function MyComponent() {
 *   const { partner, discount } = useAnalytics();
 *
 *   return (
 *     <div>
 *       {partner && <img src={partner.image} alt={partner.name} />}
 *       {discount && <p>Discount: {discount.amount}%</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAnalytics() {
  const [data, setData] = useState<PartnerData | null>({
    partner: null,
    discount: null,
  });

  const initialize = useCallback(() => {
    if (!isDubAnalyticsReady()) {
      return;
    }

    window.dubAnalytics('ready', () => {
      const { partner = null, discount = null } = window.DubAnalytics || {};
      setData({ partner, discount });
    });
  }, []);

  const trackClick = useCallback((event: TrackClickInput) => {
    if (!isDubAnalyticsReady()) {
      return;
    }

    window.dubAnalytics.trackClick(event);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...data,
    trackClick,
  };
}
