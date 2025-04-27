import { useEffect, useState } from 'react';

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
}

type DubAnalyticsEvent = 'ready';

declare global {
  interface Window {
    dubAnalytics: (event: DubAnalyticsEvent, callback: () => void) => void;
    DubAnalytics: PartnerData;
  }
}

export function useAnalytics() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);

  useEffect(() => {
    window.dubAnalytics('ready', () => {
      const { partner, discount } = window.DubAnalytics;

      setPartner(partner || null);
      setDiscount(discount || null);
    });
  }, []);

  return {
    partner,
    discount,
  };
}
