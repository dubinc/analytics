import { useEffect, useState } from 'react';
import { inject } from './generic';
import type { AnalyticsProps } from './types';

interface PartnerData {
  clickId: string;
  partner: {
    id: string;
    name: string;
    image: string;
  } | null;
  discount: {
    id: string;
    amount: number;
    type: string;
    maxDuration: number;
  } | null;
}

/**
 * Injects the Dub Web Analytics script into the page head.
 * @param props - Analytics options.
 * ```js
 * import { Analytics as DubAnalytics } from '@dub/analytics/react';
 *
 * export default function App() {
 *  return (
 *    <div>
 *      <DubAnalytics />
 *      <h1>My App</h1>
 *    </div>
 *  );
 * }
 * ```
 */
function Analytics(props: AnalyticsProps): null {
  useEffect(() => {
    inject(props);
  }, [props]);

  return null;
}

/**
 * Hook to access partner data from Dub Analytics.
 * @returns Object containing partner data if available.
 * ```js
 * import { useAnalytics } from '@dub/analytics/react';
 *
 * function MyComponent() {
 *   const { partner } = useAnalytics();
 *
 *   if (partner) {
 *     return (
 *       <div>
 *         <img src={partner.partner.image} alt={partner.partner.name} />
 *         <h2>{partner.partner.name}</h2>
 *         {partner.discount && (
 *           <p>Discount: {partner.discount.amount}%</p>
 *         )}
 *       </div>
 *     );
 *   }
 *
 *   return null;
 * }
 * ```
 */
function useAnalytics() {
  const [partner, setPartner] = useState<PartnerData | null>(null);

  useEffect(() => {
    const handleEvent = () => {
      const dubAnalytics = (window as any)._dubAnalytics;

      if (dubAnalytics) {
        setPartner(dubAnalytics.getPartnerData());
      }
    };

    window.addEventListener('DubAnalytics:tracked', handleEvent);

    handleEvent();

    return () => {
      window.removeEventListener('DubAnalytics:tracked', handleEvent);
    };
  }, []);

  return {
    partner,
  };
}

export { Analytics, useAnalytics };
export type { AnalyticsProps, PartnerData };
