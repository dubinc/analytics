import { useCallback, useEffect, useState } from 'react';

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
    dubAnalytics: (event: 'ready', callback: () => void) => void;
    DubAnalytics: PartnerData;
  }
}

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

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...data,
  };
}
