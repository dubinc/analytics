import { useCallback, useEffect, useState } from 'react';
import type {
  Discount,
  Partner,
  TrackClickInput,
  TrackLeadInput,
  TrackSaleInput,
} from './types';
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
      trackLead: (event: TrackLeadInput) => void;
      trackSale: (event: TrackSaleInput) => void;
    };
  }
}

/**
 * Hook to access Dub Web Analytics data including partner and discount information.
 * @returns Object containing partner data, discount information, and tracking methods.
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

  const trackLead = useCallback((event: TrackLeadInput) => {
    if (!isDubAnalyticsReady()) {
      return;
    }

    window.dubAnalytics.trackLead(event);
  }, []);

  const trackSale = useCallback((event: TrackSaleInput) => {
    if (!isDubAnalyticsReady()) {
      return;
    }

    window.dubAnalytics.trackSale(event);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...data,
    trackClick,
    trackLead,
    trackSale,
  };
}
