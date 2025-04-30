import { useCallback, useEffect, useState } from 'react';
import { TrackClickInput } from './types';

interface Partner {
  id: string;
  name: string;
  image: string | null;
}

interface Discount {
  id: string;
  amount: number;
  type: 'percentage' | 'flat';
  maxDuration: number | null;
}

interface PartnerData {
  partner?: Partner | null;
  discount?: Discount | null;
  error?: string | null;
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
 * @returns Object containing partner data, discount information, and any potential errors.
 * ```js
 * import { useAnalytics } from '@dub/analytics/react';
 *
 * function MyComponent() {
 *   const { partner, discount, error } = useAnalytics();
 *
 *   if (error) {
 *     return <div>Error: {error}</div>;
 *   }
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
    if (typeof window === 'undefined') {
      setData((prev) => ({ ...prev, error: 'Window is undefined (SSR)' }));
      return;
    }

    if (!window.dubAnalytics) {
      setData((prev) => ({ ...prev, error: 'dubAnalytics not available' }));
      return;
    }

    window.dubAnalytics('ready', () => {
      try {
        const { partner = null, discount = null } = window.DubAnalytics || {};

        setData({
          partner,
          discount,
          error: null,
        });
      } catch (err) {
        setData((prev) => ({
          ...prev,
          error: 'Failed to load analytics data',
        }));
      }
    });
  }, []);

  const trackClick = useCallback((event: TrackClickInput) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.dubAnalytics) {
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
